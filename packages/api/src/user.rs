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
  Db: FromRef<S>,
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
  Db: FromRef<S>,
  RedisSessionStore: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = Error;

  async fn from_request_parts(
    parts: &mut Parts,
    state: &S,
  ) -> Result<Self, Self::Rejection> {
    if let Some(user) = parts.extensions.get::<User>() {
      return Ok(user.clone());
    }

    let authorization = parts
      .extract::<Option<TypedHeader<Authorization<Bearer>>>>()
      .await
      .map_err(|_| Unauthorized)?;

    if let Some(TypedHeader(Authorization(bearer))) = authorization {
      let user = Db::from_ref(state)
        .api_token_user(&ApiToken::hash(bearer.token()))
        .await
        .context("failed to load API token")?
        .ok_or(Unauthorized)?;

      return Ok(User(user));
    }

    let store = RedisSessionStore::from_ref(state);

    let TypedHeader(cookies) = parts
      .extract::<Option<TypedHeader<headers::Cookie>>>()
      .await
      .map_err(|_| Unauthorized)?
      .ok_or(Unauthorized)?;

    let session_cookie = cookies.get(COOKIE_NAME).ok_or(Unauthorized)?;

    let session = store.load(session_cookie).await?.ok_or(Unauthorized)?;

    let user = session.get::<model::User>("user").ok_or(Unauthorized)?;

    Ok(User(user))
  }
}
