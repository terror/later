use super::*;

pub(crate) static COOKIE_NAME: &str = "SESSION";

static CSRF_TOKEN: &str = "csrf_token";

pub(crate) type ConfiguredOAuthClient = oauth2::Client<
  oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>,
  oauth2::StandardTokenResponse<
    oauth2::EmptyExtraTokenFields,
    oauth2::basic::BasicTokenType,
  >,
  oauth2::StandardTokenIntrospectionResponse<
    oauth2::EmptyExtraTokenFields,
    oauth2::basic::BasicTokenType,
  >,
  oauth2::StandardRevocableToken,
  oauth2::StandardErrorResponse<oauth2::RevocationErrorResponseType>,
  oauth2::EndpointSet,
  oauth2::EndpointNotSet,
  oauth2::EndpointNotSet,
  oauth2::EndpointNotSet,
  oauth2::EndpointSet,
>;

pub(crate) struct AuthRedirect;

impl IntoResponse for AuthRedirect {
  fn into_response(self) -> Response {
    Redirect::temporary("/auth/github").into_response()
  }
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct AuthRequest {
  code: String,
  state: String,
}

pub(crate) fn oauth_client() -> Result<ConfiguredOAuthClient> {
  let client_id =
    env::var("GITHUB_CLIENT_ID").context("GITHUB_CLIENT_ID must be set")?;

  let client_secret = env::var("GITHUB_CLIENT_SECRET")
    .context("GITHUB_CLIENT_SECRET must be set")?;

  let redirect_url = env::var("GITHUB_REDIRECT_URL")
    .unwrap_or_else(|_| "http://127.0.0.1:80/auth/authorized".to_string());

  let auth_url =
    AuthUrl::new("https://github.com/login/oauth/authorize".to_string())
      .context("failed to create new authorization server URL")?;

  let token_url =
    TokenUrl::new("https://github.com/login/oauth/access_token".to_string())
      .context("failed to create new token endpoint URL")?;

  Ok(
    OAuth2BasicClient::new(ClientId::new(client_id))
      .set_client_secret(ClientSecret::new(client_secret))
      .set_auth_uri(auth_url)
      .set_token_uri(token_url)
      .set_redirect_uri(
        RedirectUrl::new(redirect_url)
          .context("failed to create new redirection URL")?,
      ),
  )
}

pub async fn github_auth(
  AppState(client): AppState<ConfiguredOAuthClient>,
  AppState(store): AppState<redis_store::RedisSessionStore>,
) -> Result<impl IntoResponse> {
  let (auth_url, csrf_token) = client
    .authorize_url(CsrfToken::new_random)
    .add_scope(Scope::new("user:email".to_string()))
    .url();

  let mut session = Session::new();

  session
    .insert(CSRF_TOKEN, &csrf_token)
    .context("failed in inserting CSRF token into session")?;

  let cookie = store
    .store_session(session)
    .await
    .context("failed to store CSRF token session")?
    .context("unexpected error retrieving CSRF cookie value")?;

  let cookie =
    format!("{COOKIE_NAME}={cookie}; SameSite=Lax; HttpOnly; Path=/");

  let mut headers = HeaderMap::new();

  headers.insert(
    SET_COOKIE,
    cookie.parse().context("failed to parse cookie")?,
  );

  Ok((headers, Redirect::to(auth_url.as_ref())))
}

pub(crate) async fn login_authorized(
  Query(query): Query<AuthRequest>,
  AppState(store): AppState<redis_store::RedisSessionStore>,
  AppState(oauth_client): AppState<ConfiguredOAuthClient>,
  TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> Result<impl IntoResponse> {
  validate_csrf_token(&query, &cookies, &store).await?;

  let token = oauth_client
    .exchange_code(AuthorizationCode::new(query.code.clone()))
    .request_async(&reqwest::Client::new())
    .await
    .context("failed in sending request request to authorization server")?;

  let client = reqwest::Client::new();

  let user_data: User = client
    .get("https://api.github.com/user")
    .bearer_auth(token.access_token().secret())
    .header("User-Agent", "Later-App")
    .send()
    .await
    .context("failed in sending request to GitHub API")?
    .json::<User>()
    .await
    .context("failed to deserialize response as JSON")?;

  let mut session = Session::new();

  session
    .insert("user", &user_data)
    .context("failed in inserting serialized value into session")?;

  let cookie = store
    .store_session(session)
    .await
    .context("failed to store session")?
    .context("unexpected error retrieving cookie value")?;

  let cookie =
    format!("{COOKIE_NAME}={cookie}; SameSite=Lax; HttpOnly; Path=/");

  let mut headers = HeaderMap::new();

  headers.insert(
    SET_COOKIE,
    cookie.parse().context("failed to parse cookie")?,
  );

  Ok((headers, Redirect::to("/")))
}

pub(crate) async fn logout(
  AppState(store): AppState<redis_store::RedisSessionStore>,
  TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> Result<impl IntoResponse> {
  let cookie = cookies
    .get(COOKIE_NAME)
    .context("unexpected error getting cookie name")?;

  let session = match store
    .load_session(cookie.to_string())
    .await
    .context("failed to load session")?
  {
    Some(s) => s,
    None => return Ok(Redirect::to("/")),
  };

  store
    .destroy_session(session)
    .await
    .context("failed to destroy session")?;

  Ok(Redirect::to("/"))
}

async fn validate_csrf_token(
  auth_request: &AuthRequest,
  cookies: &headers::Cookie,
  store: &redis_store::RedisSessionStore,
) -> Result<()> {
  let cookie = cookies
    .get(COOKIE_NAME)
    .context("unexpected error getting cookie name")?
    .to_string();

  let session = match store
    .load_session(cookie)
    .await
    .context("failed to load session")?
  {
    Some(session) => session,
    None => return Err(anyhow!("Session not found").into()),
  };

  let stored_csrf_token = session
    .get::<CsrfToken>(CSRF_TOKEN)
    .context("CSRF token not found in session")?
    .to_owned();

  store
    .destroy_session(session)
    .await
    .context("Failed to destroy old session")?;

  if *stored_csrf_token.secret() != auth_request.state {
    return Err(anyhow!("CSRF token mismatch").into());
  }

  Ok(())
}
