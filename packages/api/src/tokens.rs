use super::*;

#[utoipa::path(
  post,
  path = "/tokens",
  tag = "tokens",
  description = "Create an API token for the authenticated user.",
  responses(
    (status = StatusCode::CREATED, body = model::CreatedToken),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn create(
  user: User,
  AppState(db): AppState<Db>,
) -> Result<impl IntoResponse> {
  let token = ApiToken::generate().into_inner();

  db.create_api_token(user.user_id, &ApiToken::hash(&token))
    .await
    .context("failed to create API token")?;

  Ok((StatusCode::CREATED, Json(model::CreatedToken { token })))
}

#[utoipa::path(
  delete,
  path = "/tokens",
  tag = "tokens",
  description = "Revoke the API token used to authenticate the request.",
  responses(
    (status = StatusCode::NO_CONTENT),
    (status = StatusCode::UNAUTHORIZED)
  )
)]
pub(crate) async fn delete(
  AppState(db): AppState<Db>,
  authorization: Option<TypedHeader<Authorization<Bearer>>>,
) -> Result<StatusCode> {
  let TypedHeader(Authorization(bearer)) = authorization.ok_or(Unauthorized)?;

  if db
    .delete_api_token(&ApiToken::hash(bearer.token()))
    .await
    .context("failed to delete API token")?
  {
    Ok(StatusCode::NO_CONTENT)
  } else {
    Err(Unauthorized.into())
  }
}
