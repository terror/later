use super::*;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct User {
  pub(crate) id: u64,
  pub(crate) avatar_url: Option<String>,
  pub(crate) email: Option<String>,
  pub(crate) login: String,
  pub(crate) name: Option<String>,
}

impl<S> OptionalFromRequestParts<S> for User
where
  redis_store::RedisSessionStore: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = Infallible;

  async fn from_request_parts(
    parts: &mut Parts,
    state: &S,
  ) -> Result<Option<Self>, Self::Rejection> {
    match <User as FromRequestParts<S>>::from_request_parts(parts, state).await
    {
      Ok(res) => Ok(Some(res)),
      Err(_) => Ok(None),
    }
  }
}

impl<S> FromRequestParts<S> for User
where
  redis_store::RedisSessionStore: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = AuthRedirect;

  async fn from_request_parts(
    parts: &mut Parts,
    state: &S,
  ) -> Result<Self, Self::Rejection> {
    let store = redis_store::RedisSessionStore::from_ref(state);

    let cookies = parts
      .extract::<TypedHeader<headers::Cookie>>()
      .await
      .map_err(|e| match *e.name() {
        header::COOKIE => match e.reason() {
          TypedHeaderRejectionReason::Missing => AuthRedirect,
          _ => panic!("unexpected error getting Cookie header(s): {e}"),
        },
        _ => panic!("unexpected error getting cookies: {e}"),
      })?;

    let session_cookie = cookies.get(COOKIE_NAME).ok_or(AuthRedirect)?;

    let session = store
      .load_session(session_cookie.to_string())
      .await
      .unwrap()
      .ok_or(AuthRedirect)?;

    let user = session.get::<User>("user").ok_or(AuthRedirect)?;

    Ok(user)
  }
}
