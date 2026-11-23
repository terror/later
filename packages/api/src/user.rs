use super::*;

#[derive(Debug, Clone)]
pub(crate) struct User(pub(crate) model::User);

impl Deref for User {
  type Target = model::User;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl From<User> for model::User {
  fn from(value: User) -> Self {
    value.0
  }
}

impl<S> OptionalFromRequestParts<S> for User
where
  RedisSessionStore: FromRef<S>,
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
  RedisSessionStore: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = Unauthorized;

  async fn from_request_parts(
    parts: &mut Parts,
    state: &S,
  ) -> Result<Self, Self::Rejection> {
    let store = RedisSessionStore::from_ref(state);

    let cookies = parts
      .extract::<TypedHeader<headers::Cookie>>()
      .await
      .map_err(|e| match *e.name() {
        header::COOKIE => match e.reason() {
          TypedHeaderRejectionReason::Missing => Unauthorized,
          _ => panic!("unexpected error getting Cookie header(s): {e}"),
        },
        _ => panic!("unexpected error getting cookies: {e}"),
      })?;

    let session_cookie = cookies.get(COOKIE_NAME).ok_or(Unauthorized)?;

    let session = store
      .load_session(session_cookie.to_string())
      .await
      .unwrap()
      .ok_or(Unauthorized)?;

    let user = session.get::<model::User>("user").ok_or(Unauthorized)?;

    Ok(User(user))
  }
}
