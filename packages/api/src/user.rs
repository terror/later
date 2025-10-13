use super::*;

#[derive(Debug, Deserialize)]
pub(crate) struct User {
  pub(crate) id: u64,
  pub(crate) avatar_url: Option<String>,
  pub(crate) email: Option<String>,
  pub(crate) login: String,
  pub(crate) name: Option<String>,
}

impl User {
  pub(crate) fn into_new_user(
    self,
    email_override: Option<String>,
  ) -> Result<model::NewUser> {
    let email = self.email.or(email_override);

    let github_id = i64::try_from(self.id)
      .context("GitHub user id exceeds supported range for BIGINT")?;

    Ok(model::NewUser {
      github_id,
      email,
      username: self.login,
      name: self.name,
      avatar_url: self.avatar_url,
    })
  }
}

#[derive(Debug, Deserialize)]
pub(crate) struct Email {
  pub(crate) email: String,
  pub(crate) primary: bool,
  pub(crate) verified: bool,
}

#[derive(Debug, Clone)]
pub(crate) struct SessionUser(pub model::User);

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
