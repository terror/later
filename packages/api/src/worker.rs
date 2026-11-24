use super::*;

const LEASE: Duration = Duration::from_secs(300);

const MAX_ATTEMPTS: i32 = 3;

const POLL_INTERVAL: Duration = Duration::from_secs(2);

const RETRY_DELAY: Duration = Duration::from_secs(15);

pub(crate) const WORKERS: usize = 4;

fn backoff(attempts: i32) -> Duration {
  RETRY_DELAY * 4u32.pow(u32::try_from(attempts - 1).unwrap_or(0))
}

async fn process(
  db: &Db,
  fetcher: &Fetcher,
  article: &ClaimedArticle,
) -> anyhow::Result<()> {
  let url = Url::parse(&article.url)
    .with_context(|| format!("invalid URL `{}`", article.url))?;

  match fetcher.fetch(&url).await {
    Ok(Page { html, url }) => {
      let (html, content) = task::spawn_blocking(move || {
        let content = extraction::extract(&html, &url);
        (html, content)
      })
      .await
      .context("article extraction task failed")?;

      db.finish_extraction(article.article_id, &html, content.as_ref())
        .await?;
    }
    Err(error) => {
      warn!("failed to fetch {url}: {error:#}");

      if article.attempts >= MAX_ATTEMPTS {
        db.fail_extraction(article.article_id).await?;
      } else {
        db.retry_extraction(article.article_id, backoff(article.attempts))
          .await?;
      }
    }
  }

  Ok(())
}

pub(crate) async fn run(db: Db, fetcher: Fetcher) {
  loop {
    match db.claim_article(LEASE).await {
      Ok(Some(article)) => {
        if let Err(error) = process(&db, &fetcher, &article).await {
          error!(
            "failed to process article {}: {error:#}",
            article.article_id
          );
        }
      }
      Ok(None) => time::sleep(POLL_INTERVAL).await,
      Err(error) => {
        error!("failed to claim article: {error}");
        time::sleep(POLL_INTERVAL).await;
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use {super::*, http::Method, model::ArticleStatus, serde_json::json};

  #[tokio::test(flavor = "multi_thread")]
  async fn process() {
    let context = TestContext::new().await;

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();

    let addr = listener.local_addr().unwrap();

    let router = Router::new().route(
      "/",
      get(|| async {
        axum::response::Html(
          "<html><head><title>foo</title></head><body><article><p>bar baz</p></article></body></html>",
        )
      }),
    );

    task::spawn(async move { axum::serve(listener, router).await.unwrap() });

    let fetcher = Fetcher {
      filter: |ip| ip.is_loopback(),
      ..Fetcher::default()
    };

    let save = async |url: String| {
      let (status, body) = context
        .request(Method::POST, "/articles", Some(json!({ "url": url })))
        .await;

      assert_eq!(status, StatusCode::CREATED);

      serde_json::from_str::<model::Article>(&body).unwrap()
    };

    let status = async |article: &model::Article| {
      context
        .db
        .article(context.user.user_id, article.article_id)
        .await
        .unwrap()
        .unwrap()
        .article
        .status
    };

    let found = save(format!("http://{addr}/")).await;

    assert_eq!(found.status, ArticleStatus::Pending);

    let claimed = context.db.claim_article(LEASE).await.unwrap().unwrap();

    super::process(&context.db, &fetcher, &claimed)
      .await
      .unwrap();

    assert_eq!(
      context
        .db
        .article(context.user.user_id, found.article_id)
        .await
        .unwrap(),
      Some(model::ArticleWithContent {
        article: model::Article {
          status: ArticleStatus::Extracted,
          title: Some("foo".into()),
          excerpt: Some("bar baz".into()),
          word_count: Some(2),
          reading_time_minutes: Some(1),
          ..found
        },
        content: Some("<div><article><p>bar baz</p></article></div>".into()),
      }),
    );

    let missing = save(format!("http://{addr}/missing")).await;

    let claimed = context.db.claim_article(LEASE).await.unwrap().unwrap();

    super::process(&context.db, &fetcher, &claimed)
      .await
      .unwrap();

    assert_eq!(status(&missing).await, ArticleStatus::Pending);

    assert_eq!(context.db.claim_article(LEASE).await.unwrap(), None);

    super::process(
      &context.db,
      &fetcher,
      &ClaimedArticle {
        attempts: MAX_ATTEMPTS,
        ..claimed
      },
    )
    .await
    .unwrap();

    assert_eq!(status(&missing).await, ArticleStatus::Failed);
  }

  #[test]
  fn backoff() {
    #[track_caller]
    fn case(attempts: i32, expected: u64) {
      assert_eq!(super::backoff(attempts), Duration::from_secs(expected));
    }

    case(1, 15);
    case(2, 60);
    case(3, 240);
  }
}
