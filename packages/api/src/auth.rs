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

#[utoipa::path(
  get,
  path = "/auth/login",
  tag = "auth",
  description = "Initiate the GitHub OAuth flow and set the CSRF session cookie.",
  responses(
    (status = StatusCode::SEE_OTHER, description = "Redirect to GitHub's OAuth authorization page."),
    (status = StatusCode::INTERNAL_SERVER_ERROR, description = "Failed to initiate the OAuth flow.", body = String)
  )
)]
pub async fn login(
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
  validate_csrf_token(&query, &cookies, &store).await?;

  let token = oauth_client
    .exchange_code(oauth2::AuthorizationCode::new(query.code.clone()))
    .request_async(&reqwest::Client::new())
    .await
    .context("failed in sending request request to authorization server")?;

  let client = reqwest::Client::new();

  let access_token = token.access_token().secret().to_owned();

  let github_user = client
    .get("https://api.github.com/user")
    .bearer_auth(&access_token)
    .header("User-Agent", "Later-App")
    .send()
    .await
    .context("failed in sending request to GitHub API")?
    .json::<User>()
    .await
    .context("failed to deserialize response as JSON")?;

  let fallback_email = if github_user.email.is_some() {
    None
  } else {
    fetch_primary_email(&client, &access_token).await?
  };

  let persisted_user = db
    .upsert_user(github_user.into_new_user(fallback_email)?)
    .await
    .context("failed to persist authenticated user")?;

  let mut session = Session::new();

  session
    .insert("user", &persisted_user)
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

#[utoipa::path(
  get,
  path = "/auth/logout",
  tag = "auth",
  description = "Invalidate the active user session and redirect back to the client.",
  responses(
    (status = StatusCode::SEE_OTHER, description = "Redirect to the requested post-logout location."),
    (status = StatusCode::INTERNAL_SERVER_ERROR, description = "Failed to destroy the session.", body = String)
  )
)]
pub(crate) async fn logout(
  AppState(store): AppState<RedisSessionStore>,
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

async fn fetch_primary_email(
  client: &reqwest::Client,
  access_token: &str,
) -> Result<Option<String>> {
  let response = client
    .get("https://api.github.com/user/emails")
    .bearer_auth(access_token)
    .header("User-Agent", "Later-App")
    .send()
    .await
    .context("failed to send request for GitHub email addresses")?;

  if !response.status().is_success() {
    return Ok(None);
  }

  let emails = response
    .json::<Vec<Email>>()
    .await
    .context("failed to deserialize GitHub email response")?;

  let primary = emails
    .iter()
    .find(|email| email.primary && email.verified)
    .or_else(|| emails.iter().find(|email| email.verified))
    .or_else(|| emails.first());

  Ok(primary.map(|email| email.email.clone()))
}

async fn validate_csrf_token(
  auth_request: &AuthRequest,
  cookies: &headers::Cookie,
  store: &RedisSessionStore,
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
