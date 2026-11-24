use super::*;

const TRACKING_PARAMETERS: &[&str] = &[
  "_hsenc", "_hsmktg", "dclid", "fbclid", "gbraid", "gclid", "igshid",
  "mc_cid", "mc_eid", "msclkid", "wbraid", "yclid",
];

#[derive(Debug, Deserialize, ToSchema)]
pub(crate) struct SaveArticle {
  html: Option<String>,
  url: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub(crate) struct UpdateArticle {
  is_archived: Option<bool>,
  is_favorited: Option<bool>,
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
  responses(
    (status = StatusCode::OK, body = Vec<model::Article>),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn list(
  user: User,
  AppState(db): AppState<Db>,
) -> Result<Json<Vec<model::Article>>> {
  Ok(Json(
    db.articles(user.user_id)
      .await
      .context("failed to load articles")?,
  ))
}

#[utoipa::path(
  post,
  path = "/articles",
  tag = "articles",
  request_body = SaveArticle,
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
  Json(request): Json<SaveArticle>,
) -> Result<impl IntoResponse> {
  let url = Url::parse(&request.url)
    .ok()
    .filter(|url| matches!(url.scheme(), "http" | "https"))
    .ok_or_else(|| BadRequest(format!("invalid URL `{}`", request.url)))?;

  let normalized_url = normalize_url(&url);

  let (html, content) = match request.html {
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
  patch,
  path = "/articles/{article_id}",
  tag = "articles",
  params(("article_id" = Uuid, Path)),
  request_body = UpdateArticle,
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
  Json(request): Json<UpdateArticle>,
) -> Result<Json<model::Article>> {
  Ok(Json(
    db.update_article(
      user.user_id,
      article_id,
      request.is_archived,
      request.is_favorited,
    )
    .await
    .context("failed to update article")?
    .ok_or(NotFound)?,
  ))
}

#[cfg(test)]
mod tests {
  use super::*;

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
