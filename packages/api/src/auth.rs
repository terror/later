use super::*;

pub(crate) static COOKIE_NAME: &str = "SESSION";

static CSRF_TOKEN: &str = "csrf_token";
static REDIRECT_URL: &str = "redirect_url";

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
    Redirect::temporary("/auth/login").into_response()
  }
}

#[derive(Debug, Deserialize)]
pub(crate) struct AuthRequest {
  code: String,
  state: String,
}

#[derive(Debug, Deserialize)]
pub(crate) struct RedirectParams {
  redirect: Option<String>,
}

pub(crate) fn oauth_client() -> Result<ConfiguredOAuthClient> {
  let client_id =
    env::var("GITHUB_CLIENT_ID").context("GITHUB_CLIENT_ID must be set")?;

  let client_secret = env::var("GITHUB_CLIENT_SECRET")
    .context("GITHUB_CLIENT_SECRET must be set")?;

  let redirect_url = env::var("GITHUB_REDIRECT_URL")
    .context("GITHUB_REDIRECT_URL must be set")?;

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

#[utoipa::path(
  get,
  path = "/auth/login",
  tag = "auth",
  description = "Initiate the GitHub OAuth flow and set the CSRF session cookie.",
  params(
    ("redirect" = String, Query, description = "URL to redirect to after authentication completes.")
  ),
  responses(
    (status = StatusCode::SEE_OTHER, description = "Redirect to GitHub's OAuth authorization page."),
    (status = StatusCode::INTERNAL_SERVER_ERROR, description = "Failed to initiate the OAuth flow.", body = String)
  )
)]
pub async fn login(
  Query(params): Query<RedirectParams>,
  AppState(client): AppState<ConfiguredOAuthClient>,
  AppState(store): AppState<RedisSessionStore>,
) -> Result<impl IntoResponse> {
  let (auth_url, csrf_token) = client
    .authorize_url(CsrfToken::new_random)
    .add_scope(Scope::new("user:email".to_string()))
    .url();

  let mut session = Session::new();

  session
    .insert(CSRF_TOKEN, &csrf_token)
    .context("failed in inserting CSRF token into session")?;

  if let Some(redirect) = params.redirect {
    session
      .insert(REDIRECT_URL, &redirect)
      .context("failed in inserting redirect into session")?;
  }

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

#[utoipa::path(
  get,
  path = "/auth/authorized",
  tag = "auth",
  description = "Complete the GitHub OAuth flow, validate state, and establish a user session.",
  params(
    ("code" = String, Query, description = "Authorization code returned by GitHub."),
    ("state" = String, Query, description = "Opaque state used to validate the CSRF token.")
  ),
  responses(
    (status = StatusCode::SEE_OTHER, description = "Redirect to the application after creating the session."),
    (status = StatusCode::INTERNAL_SERVER_ERROR, description = "Failed to exchange the authorization code or create the session.", body = String)
  )
)]
pub(crate) async fn login_authorized(
  Query(query): Query<AuthRequest>,
  AppState(db): AppState<Db>,
  AppState(store): AppState<RedisSessionStore>,
  AppState(oauth_client): AppState<ConfiguredOAuthClient>,
  TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> Result<impl IntoResponse> {
  let redirect = validate_csrf_token(&query, &cookies, &store).await?;

  let token = oauth_client
    .exchange_code(oauth2::AuthorizationCode::new(query.code))
    .request_async(&reqwest::Client::new())
    .await
    .context("failed in sending request request to authorization server")?;

  let client = reqwest::Client::new();

  let access_token = token.access_token().secret().to_owned();

  let user = client
    .get("https://api.github.com/user")
    .bearer_auth(&access_token)
    .header("User-Agent", "Later-App")
    .send()
    .await
    .context("failed in sending request to GitHub API")?
    .json::<Value>()
    .await
    .context("failed to deserialize response as JSON")?;

  let name = user.get("name").and_then(Value::as_str);

  let emails = client
    .get("https://api.github.com/user/emails")
    .bearer_auth(&access_token)
    .header("User-Agent", "Later-App")
    .send()
    .await
    .context("failed to fetch user emails from GitHub API")?
    .json::<Value>()
    .await
    .context("failed to deserialize emails response as JSON")?;

  let is_verified = |email: &&Value| {
    email
      .get("verified")
      .and_then(Value::as_bool)
      .unwrap_or(false)
  };

  let is_primary = |email: &&Value| {
    email
      .get("primary")
      .and_then(Value::as_bool)
      .unwrap_or(false)
  };

  let email = emails
    .as_array()
    .and_then(|emails| {
      emails
        .iter()
        .find(|e| is_primary(e) && is_verified(e))
        .or_else(|| emails.iter().find(is_verified))
        .and_then(|e| e.get("email")?.as_str())
    })
    .ok_or_else(|| anyhow!("no verified email found for GitHub user"))?;

  let user = db
    .upsert_user(email, name)
    .await
    .context("failed to persist authenticated user")?;

  let mut session = Session::new();

  session
    .insert("user", &user)
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

  let redirect_target = redirect.unwrap_or_else(|| "/".to_string());

  Ok((headers, Redirect::to(redirect_target.as_str())))
}

#[utoipa::path(
  get,
  path = "/auth/logout",
  tag = "auth",
  description = "Invalidate the active user session and redirect back to the client.",
  params(
    ("redirect" = String, Query, description = "URL to redirect to after logout completes.")
  ),
  responses(
    (status = StatusCode::SEE_OTHER, description = "Redirect to the requested post-logout location."),
    (status = StatusCode::INTERNAL_SERVER_ERROR, description = "Failed to destroy the session.", body = String)
  )
)]
pub(crate) async fn logout(
  Query(params): Query<RedirectParams>,
  AppState(store): AppState<RedisSessionStore>,
  TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> Result<impl IntoResponse> {
  let redirect_target = params.redirect.unwrap_or_else(|| "/".to_string());

  let cookie = match cookies.get(COOKIE_NAME) {
    Some(cookie) => cookie.to_string(),
    None => return Ok(Redirect::to(redirect_target.as_str())),
  };

  let session = match store
    .load_session(cookie)
    .await
    .context("failed to load session")?
  {
    Some(s) => s,
    None => return Ok(Redirect::to(redirect_target.as_str())),
  };

  store
    .destroy_session(session)
    .await
    .context("failed to destroy session")?;

  Ok(Redirect::to(redirect_target.as_str()))
}

#[utoipa::path(
  get,
  path = "/auth/session",
  tag = "auth",
  description = "Retrieve the current authenticated user from the session.",
  responses(
    (status = StatusCode::OK, description = "Currently authenticated user.", body = model::User),
    (status = StatusCode::SEE_OTHER, description = "Not authenticated, redirect to GitHub OAuth.")
  )
)]
pub(crate) async fn session(User(user): User) -> impl IntoResponse {
  Json(user)
}

async fn validate_csrf_token(
  auth_request: &AuthRequest,
  cookies: &headers::Cookie,
  store: &RedisSessionStore,
) -> Result<Option<String>> {
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

  let redirect = session.get::<String>(REDIRECT_URL);

  store
    .destroy_session(session)
    .await
    .context("Failed to destroy old session")?;

  if *stored_csrf_token.secret() != auth_request.state {
    return Err(anyhow!("CSRF token mismatch").into());
  }

  Ok(redirect)
}
