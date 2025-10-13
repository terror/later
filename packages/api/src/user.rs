use super::*;

#[derive(Debug, Deserialize)]
pub(crate) struct User {
  pub(crate) email: Option<String>,
  pub(crate) name: Option<String>,
}

impl TryInto<NewUser> for User {
  type Error = Error;

  fn try_into(self) -> Result<NewUser> {
    let email = self
      .email
      .ok_or_else(|| anyhow!("GitHub user email not provided"))?;

    Ok(NewUser {
      email,
      name: self.name,
    })
  }
}

#[derive(Debug, Clone)]
pub(crate) struct SessionUser(pub(crate) model::User);

impl Deref for SessionUser {
  type Target = model::User;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl From<SessionUser> for model::User {
  fn from(value: SessionUser) -> Self {
    value.0
  }
}

impl<S> OptionalFromRequestParts<S> for SessionUser
where
  RedisSessionStore: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = Infallible;

  async fn from_request_parts(
    parts: &mut Parts,
    state: &S,
  ) -> Result<Option<Self>, Self::Rejection> {
    match <SessionUser as FromRequestParts<S>>::from_request_parts(parts, state)
      .await
    {
      Ok(res) => Ok(Some(res)),
      Err(_) => Ok(None),
    }
  }
}

impl<S> FromRequestParts<S> for SessionUser
where
  RedisSessionStore: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = AuthRedirect;

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

    let user = session.get::<model::User>("user").ok_or(AuthRedirect)?;

    Ok(SessionUser(user))
  }
}
