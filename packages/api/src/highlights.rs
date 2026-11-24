use super::*;

fn is_color(color: &str) -> bool {
  color.strip_prefix('#').is_some_and(|hex| {
    hex.len() == 6 && hex.chars().all(|c| c.is_ascii_hexdigit())
  })
}

#[utoipa::path(
  post,
  path = "/articles/{article_id}/highlights",
  tag = "highlights",
  description = "Highlight a range of the article's text. Offsets count UTF-16 code units into the article's plain text.",
  params(("article_id" = Uuid, Path)),
  request_body = model::CreateHighlight,
  responses(
    (status = StatusCode::CREATED, body = model::Highlight),
    (status = StatusCode::BAD_REQUEST, body = String),
    (status = StatusCode::NOT_FOUND),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn create(
  user: User,
  AppState(db): AppState<Db>,
  Path(article_id): Path<Uuid>,
  Json(request): Json<model::CreateHighlight>,
) -> Result<impl IntoResponse> {
  let text = db
    .article_text(user.user_id, article_id)
    .await
    .context("failed to load article text")?
    .ok_or(NotFound)?;

  let anchor = Anchor::new(&text, request.start_offset, request.end_offset)
    .ok_or_else(|| {
      BadRequest(format!(
        "invalid highlight range {}..{}",
        request.start_offset, request.end_offset,
      ))
    })?;

  if anchor.selected_text != request.selected_text {
    return Err(
      BadRequest("selected text does not match article text".into()).into(),
    );
  }

  let highlight = db
    .create_highlight(&NewHighlight {
      article_id,
      context_after: anchor.context_after,
      context_before: anchor.context_before,
      end_offset: request.end_offset,
      selected_text: anchor.selected_text,
      start_offset: request.start_offset,
      user_id: user.user_id,
    })
    .await
    .context("failed to create highlight")?
    .ok_or(NotFound)?;

  Ok((StatusCode::CREATED, Json(highlight)))
}

#[utoipa::path(
  delete,
  path = "/articles/{article_id}/highlights/{highlight_id}",
  tag = "highlights",
  params(("article_id" = Uuid, Path), ("highlight_id" = Uuid, Path)),
  responses(
    (status = StatusCode::NO_CONTENT),
    (status = StatusCode::NOT_FOUND),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn delete(
  user: User,
  AppState(db): AppState<Db>,
  Path((article_id, highlight_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode> {
  if db
    .delete_highlight(user.user_id, article_id, highlight_id)
    .await
    .context("failed to delete highlight")?
  {
    Ok(StatusCode::NO_CONTENT)
  } else {
    Err(NotFound.into())
  }
}

#[utoipa::path(
  get,
  path = "/articles/{article_id}/highlights",
  tag = "highlights",
  params(("article_id" = Uuid, Path)),
  responses(
    (status = StatusCode::OK, body = Vec<model::Highlight>),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn list(
  user: User,
  AppState(db): AppState<Db>,
  Path(article_id): Path<Uuid>,
) -> Result<Json<Vec<model::Highlight>>> {
  Ok(Json(
    db.highlights(user.user_id, article_id)
      .await
      .context("failed to load highlights")?,
  ))
}

#[utoipa::path(
  patch,
  path = "/articles/{article_id}/highlights/{highlight_id}",
  tag = "highlights",
  description = "Update a highlight's color or note. An empty note removes it.",
  params(("article_id" = Uuid, Path), ("highlight_id" = Uuid, Path)),
  request_body = model::UpdateHighlight,
  responses(
    (status = StatusCode::OK, body = model::Highlight),
    (status = StatusCode::BAD_REQUEST, body = String),
    (status = StatusCode::NOT_FOUND),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn update(
  user: User,
  AppState(db): AppState<Db>,
  Path((article_id, highlight_id)): Path<(Uuid, Uuid)>,
  Json(request): Json<model::UpdateHighlight>,
) -> Result<Json<model::Highlight>> {
  if let Some(color) = request.color.as_deref().filter(|color| !is_color(color))
  {
    return Err(BadRequest(format!("invalid color `{color}`")).into());
  }

  Ok(Json(
    db.update_highlight(
      user.user_id,
      article_id,
      highlight_id,
      request.color.as_deref(),
      request.note.as_deref(),
    )
    .await
    .context("failed to update highlight")?
    .ok_or(NotFound)?,
  ))
}

#[cfg(test)]
mod tests {
  use {super::*, http::Method, serde_json::json};

  #[test]
  fn is_color() {
    #[track_caller]
    fn case(color: &str, expected: bool) {
      assert_eq!(super::is_color(color), expected);
    }

    case("#FFEB3B", true);
    case("#ffeb3b", true);
    case("FFEB3B", false);
    case("#FFEB3", false);
    case("#FFEB3BB", false);
    case("#GGGGGG", false);
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn highlights() {
    let context = TestContext::new().await;

    let (article, _) = context
      .db
      .save_article(&NewArticle {
        content: Some(ArticleContent {
          author: None,
          content: "<p>😀 foo bar</p>".into(),
          dir: None,
          excerpt: None,
          lang: None,
          publication_date: None,
          reading_time_minutes: 1,
          site_name: None,
          text_content: "😀 foo bar".into(),
          title: None,
          word_count: 3,
        }),
        html: None,
        normalized_url: "https://foo.com/",
        url: "https://foo.com/",
        user_id: context.user.user_id,
      })
      .await
      .unwrap();

    let path = format!("/articles/{}/highlights", article.article_id);

    let (status, body) = context
      .request(
        Method::POST,
        &path,
        Some(
          json!({ "start_offset": 3, "end_offset": 6, "selected_text": "foo" }),
        ),
      )
      .await;

    assert_eq!(status, StatusCode::CREATED);

    let highlight = serde_json::from_str::<model::Highlight>(&body).unwrap();

    assert_eq!(
      highlight,
      model::Highlight {
        highlight_id: highlight.highlight_id,
        article_id: article.article_id,
        selected_text: "foo".into(),
        context_before: Some("😀 ".into()),
        context_after: Some(" bar".into()),
        start_offset: 3,
        end_offset: 6,
        color: "#FFEB3B".into(),
        note: None,
        created_at: highlight.created_at,
        updated_at: highlight.updated_at,
      },
    );

    #[track_caller]
    fn case(
      (status, body): (StatusCode, String),
      expected_status: StatusCode,
      expected_body: &str,
    ) {
      assert_eq!((status, body.as_str()), (expected_status, expected_body));
    }

    case(
      context
        .request(
          Method::POST,
          &path,
          Some(json!({ "start_offset": 1, "end_offset": 6, "selected_text": "foo" })),
        )
        .await,
      StatusCode::BAD_REQUEST,
      "error: invalid highlight range 1..6",
    );

    case(
      context
        .request(
          Method::POST,
          &path,
          Some(json!({ "start_offset": 3, "end_offset": 6, "selected_text": "bar" })),
        )
        .await,
      StatusCode::BAD_REQUEST,
      "error: selected text does not match article text",
    );

    case(
      context
        .request(
          Method::POST,
          &format!("/articles/{}/highlights", Uuid::nil()),
          Some(json!({ "start_offset": 3, "end_offset": 6, "selected_text": "foo" })),
        )
        .await,
      StatusCode::NOT_FOUND,
      "error: not found",
    );

    case(
      context.request(Method::GET, &path, None).await,
      StatusCode::OK,
      &serde_json::to_string(&vec![highlight.clone()]).unwrap(),
    );

    let path = format!("{path}/{}", highlight.highlight_id);

    let (status, body) = context
      .request(
        Method::PATCH,
        &path,
        Some(json!({ "color": "#000000", "note": "baz" })),
      )
      .await;

    assert_eq!(status, StatusCode::OK);

    let updated = serde_json::from_str::<model::Highlight>(&body).unwrap();

    assert_eq!(
      updated,
      model::Highlight {
        color: "#000000".into(),
        note: Some("baz".into()),
        updated_at: updated.updated_at,
        ..highlight
      },
    );

    case(
      context
        .request(Method::PATCH, &path, Some(json!({ "color": "foo" })))
        .await,
      StatusCode::BAD_REQUEST,
      "error: invalid color `foo`",
    );

    case(
      context.request(Method::DELETE, &path, None).await,
      StatusCode::NO_CONTENT,
      "",
    );

    case(
      context.request(Method::DELETE, &path, None).await,
      StatusCode::NOT_FOUND,
      "error: not found",
    );

    case(
      context
        .request(Method::PATCH, &path, Some(json!({ "note": "baz" })))
        .await,
      StatusCode::NOT_FOUND,
      "error: not found",
    );
  }
}
