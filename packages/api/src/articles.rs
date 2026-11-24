use super::*;

const TRACKING_PARAMETERS: &[&str] = &[
  "_hsenc", "_hsmktg", "dclid", "fbclid", "gbraid", "gclid", "igshid",
  "mc_cid", "mc_eid", "msclkid", "wbraid", "yclid",
];

const DEFAULT_LIMIT: usize = 50;

const MAX_LIMIT: usize = 100;

#[derive(Debug, PartialEq)]
struct Cursor {
  article_id: Uuid,
  date_saved: DateTime<Utc>,
}

impl Display for Cursor {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(
      f,
      "{}_{}",
      self.date_saved.timestamp_micros(),
      self.article_id
    )
  }
}

impl FromStr for Cursor {
  type Err = BadRequest;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    s.split_once('_')
      .and_then(|(date_saved, article_id)| {
        Some(Self {
          article_id: article_id.parse().ok()?,
          date_saved: DateTime::from_timestamp_micros(
            date_saved.parse().ok()?,
          )?,
        })
      })
      .ok_or_else(|| BadRequest(format!("invalid cursor `{s}`")))
  }
}

fn normalize_url(url: &Url) -> Url {
  let mut normalized = url.clone();

  normalized.set_fragment(None);

  let pairs = url
    .query_pairs()
    .filter(|(key, _)| {
      !key.starts_with("utm_") && !TRACKING_PARAMETERS.contains(&key.as_ref())
    })
    .map(|(key, value)| (key.into_owned(), value.into_owned()))
    .collect::<Vec<(String, String)>>();

  if pairs.is_empty() {
    normalized.set_query(None);
  } else if pairs.len() != url.query_pairs().count() {
    normalized.query_pairs_mut().clear().extend_pairs(pairs);
  }

  normalized
}

#[utoipa::path(
  delete,
  path = "/articles/{article_id}",
  tag = "articles",
  params(("article_id" = Uuid, Path)),
  responses(
    (status = StatusCode::NO_CONTENT),
    (status = StatusCode::NOT_FOUND),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn delete(
  user: User,
  AppState(db): AppState<Db>,
  Path(article_id): Path<Uuid>,
) -> Result<StatusCode> {
  if db
    .delete_article(user.user_id, article_id)
    .await
    .context("failed to delete article")?
  {
    Ok(StatusCode::NO_CONTENT)
  } else {
    Err(NotFound.into())
  }
}

#[utoipa::path(
  get,
  path = "/articles/{article_id}",
  tag = "articles",
  params(("article_id" = Uuid, Path)),
  responses(
    (status = StatusCode::OK, body = model::ArticleWithContent),
    (status = StatusCode::NOT_FOUND),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn get(
  user: User,
  AppState(db): AppState<Db>,
  Path(article_id): Path<Uuid>,
) -> Result<Json<model::ArticleWithContent>> {
  Ok(Json(
    db.article(user.user_id, article_id)
      .await
      .context("failed to load article")?
      .ok_or(NotFound)?,
  ))
}

#[utoipa::path(
  get,
  path = "/articles",
  tag = "articles",
  params(model::ListArticles),
  responses(
    (status = StatusCode::OK, body = model::ArticlePage),
    (status = StatusCode::BAD_REQUEST, body = String),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn list(
  user: User,
  AppState(db): AppState<Db>,
  Query(params): Query<model::ListArticles>,
) -> Result<Json<model::ArticlePage>> {
  let limit = params.limit.unwrap_or(DEFAULT_LIMIT);

  if !(1..=MAX_LIMIT).contains(&limit) {
    return Err(
      BadRequest(format!("limit must be between 1 and {MAX_LIMIT}")).into(),
    );
  }

  let cursor = params
    .cursor
    .as_deref()
    .map(str::parse::<Cursor>)
    .transpose()?;

  let mut articles = db
    .articles(
      user.user_id,
      cursor.map(|cursor| (cursor.date_saved, cursor.article_id)),
      i64::try_from(limit + 1).context("invalid limit")?,
    )
    .await
    .context("failed to load articles")?;

  let more = articles.len() > limit;

  articles.truncate(limit);

  let next_cursor = articles.last().filter(|_| more).map(|article| {
    Cursor {
      article_id: article.article_id,
      date_saved: article.date_saved,
    }
    .to_string()
  });

  Ok(Json(model::ArticlePage {
    articles,
    next_cursor,
  }))
}

fn check_progress(progress: &model::ReadingProgress) -> Result<(), BadRequest> {
  if !(0.0..=1.0).contains(&progress.scroll_position) {
    return Err(BadRequest(format!(
      "invalid scroll position `{}`",
      progress.scroll_position
    )));
  }

  if progress.time_spent_seconds < 0 {
    return Err(BadRequest(format!(
      "invalid time spent `{}`",
      progress.time_spent_seconds
    )));
  }

  Ok(())
}

#[utoipa::path(
  post,
  path = "/articles",
  tag = "articles",
  request_body = model::SaveArticle,
  responses(
    (status = StatusCode::CREATED, body = model::Article),
    (status = StatusCode::OK, body = model::Article),
    (status = StatusCode::BAD_REQUEST, body = String),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn save(
  user: User,
  AppState(db): AppState<Db>,
  Json(request): Json<model::SaveArticle>,
) -> Result<impl IntoResponse> {
  let url = Url::parse(&request.url)
    .ok()
    .filter(|url| matches!(url.scheme(), "http" | "https"))
    .ok_or_else(|| BadRequest(format!("invalid URL `{}`", request.url)))?;

  let normalized_url = normalize_url(&url);

  let (html, content) = match request.html.map(|html| html.replace('\0', "")) {
    Some(html) => {
      let url = url.clone();

      task::spawn_blocking(move || {
        let content = extraction::extract(&html, &url);
        (Some(html), content)
      })
      .await
      .context("article extraction task failed")?
    }
    None => (None, None),
  };

  let (article, created) = db
    .save_article(&NewArticle {
      content,
      html: html.as_deref(),
      normalized_url: normalized_url.as_str(),
      url: url.as_str(),
      user_id: user.user_id,
    })
    .await
    .context("failed to save article")?;

  let status = if created {
    StatusCode::CREATED
  } else {
    StatusCode::OK
  };

  Ok((status, Json(article)))
}

#[utoipa::path(
  put,
  path = "/articles/{article_id}/progress",
  tag = "articles",
  params(("article_id" = Uuid, Path)),
  request_body = model::ReadingProgress,
  responses(
    (status = StatusCode::OK, body = model::ReadingProgress),
    (status = StatusCode::BAD_REQUEST, body = String),
    (status = StatusCode::NOT_FOUND),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn save_progress(
  user: User,
  AppState(db): AppState<Db>,
  Path(article_id): Path<Uuid>,
  Json(progress): Json<model::ReadingProgress>,
) -> Result<Json<model::ReadingProgress>> {
  check_progress(&progress)?;

  Ok(Json(
    db.save_progress(user.user_id, article_id, &progress)
      .await
      .context("failed to save reading progress")?
      .ok_or(NotFound)?,
  ))
}

#[utoipa::path(
  patch,
  path = "/articles/{article_id}",
  tag = "articles",
  params(("article_id" = Uuid, Path)),
  request_body = model::UpdateArticle,
  responses(
    (status = StatusCode::OK, body = model::Article),
    (status = StatusCode::NOT_FOUND),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn update(
  user: User,
  AppState(db): AppState<Db>,
  Path(article_id): Path<Uuid>,
  Json(request): Json<model::UpdateArticle>,
) -> Result<Json<model::Article>> {
  Ok(Json(
    db.update_article(
      user.user_id,
      article_id,
      request.is_archived,
      request.is_favorited,
      request.is_read,
    )
    .await
    .context("failed to update article")?
    .ok_or(NotFound)?,
  ))
}

#[cfg(test)]
mod tests {
  use {super::*, serde_json::json};

  #[tokio::test(flavor = "multi_thread")]
  async fn list() {
    let context = TestContext::new().await;

    let mut saved = Vec::new();

    for url in ["https://foo.com/", "https://bar.com/", "https://baz.com/"] {
      let (article, _) = context
        .db
        .save_article(&NewArticle {
          content: None,
          html: None,
          normalized_url: url,
          url,
          user_id: context.user.user_id,
        })
        .await
        .unwrap();

      saved.push(article);
    }

    let cursor = Cursor {
      article_id: saved[1].article_id,
      date_saved: saved[1].date_saved,
    }
    .to_string();

    assert_eq!(
      context
        .request(Method::GET, "/articles?limit=2", None)
        .await,
      (
        StatusCode::OK,
        serde_json::to_string(&model::ArticlePage {
          articles: vec![saved[2].clone(), saved[1].clone()],
          next_cursor: Some(cursor.clone()),
        })
        .unwrap(),
      ),
    );

    assert_eq!(
      context
        .request(
          Method::GET,
          &format!("/articles?limit=2&cursor={cursor}"),
          None,
        )
        .await,
      (
        StatusCode::OK,
        serde_json::to_string(&model::ArticlePage {
          articles: vec![saved[0].clone()],
          next_cursor: None,
        })
        .unwrap(),
      ),
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn save_strips_nul() {
    let context = TestContext::new().await;

    let (status, _) = context
      .request(
        Method::POST,
        "/articles",
        Some(json!({ "url": "https://foo.com/", "html": "<p>foo\0bar</p>" })),
      )
      .await;

    assert_eq!(status, StatusCode::CREATED);

    let articles = context
      .db
      .articles(context.user.user_id, None, 1)
      .await
      .unwrap();

    assert_eq!(
      context
        .db
        .article(context.user.user_id, articles[0].article_id)
        .await
        .unwrap()
        .unwrap()
        .content,
      Some("<div><p>foobar</p></div>".into()),
    );
  }

  #[test]
  fn check_progress() {
    #[track_caller]
    fn case(
      scroll_position: f64,
      time_spent_seconds: i32,
      expected: Result<(), &str>,
    ) {
      assert_eq!(
        super::check_progress(&model::ReadingProgress {
          scroll_position,
          time_spent_seconds,
        })
        .map_err(|error| error.to_string()),
        expected.map_err(str::to_owned),
      );
    }

    case(0.0, 0, Ok(()));
    case(1.0, 10, Ok(()));
    case(1.5, 0, Err("invalid scroll position `1.5`"));
    case(-0.5, 0, Err("invalid scroll position `-0.5`"));
    case(0.5, -1, Err("invalid time spent `-1`"));
  }

  #[test]
  fn normalize_url() {
    #[track_caller]
    fn case(url: &str, expected: &str) {
      assert_eq!(
        super::normalize_url(&Url::parse(url).unwrap()).as_str(),
        expected,
      );
    }

    case("https://foo.com/bar", "https://foo.com/bar");
    case("HTTPS://FOO.com:443/bar", "https://foo.com/bar");
    case("https://foo.com/bar#baz", "https://foo.com/bar");
    case("https://foo.com/bar?utm_source=baz", "https://foo.com/bar");
    case(
      "https://foo.com/bar?q=a%20b&fbclid=baz",
      "https://foo.com/bar?q=a+b",
    );
    case("https://foo.com/bar?q=a%20b", "https://foo.com/bar?q=a%20b");
    case(
      "https://foo.com/bar?b=2&utm_medium=baz&a=1",
      "https://foo.com/bar?b=2&a=1",
    );
  }
}
