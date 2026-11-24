use super::*;

pub(crate) static COOKIE_NAME: &str = "SESSION";

static CSRF_TOKEN: &str = "csrf_token";
static HANDOFF_COOKIE: &str = "handoff_cookie";
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

#[derive(Debug, Deserialize)]
pub(crate) struct AuthRequest {
  code: String,
  state: String,
}

#[derive(Debug, Deserialize)]
pub(crate) struct ExchangeParams {
  code: String,
}

#[derive(Debug, Deserialize)]
pub(crate) struct RedirectParams {
  redirect: Option<String>,
}

fn session_cookie(value: &str) -> Result<HeaderMap> {
  let cookie = format!("{COOKIE_NAME}={value}; SameSite=Lax; HttpOnly; Path=/");

  let mut headers = HeaderMap::new();

  headers.insert(
    SET_COOKIE,
    cookie.parse().context("failed to parse cookie")?,
  );

  Ok(headers)
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
  AppState(allowed_origins): AppState<AllowedOrigins>,
  AppState(clients): AppState<OAuthClients>,
  AppState(store): AppState<RedisSessionStore>,
) -> Result<Response> {
  authorize(Provider::Github, params, &allowed_origins, &clients, &store).await
}

#[utoipa::path(
  get,
  path = "/auth/google/login",
  tag = "auth",
  description = "Initiate the Google OAuth flow and set the CSRF session cookie.",
  params(
    ("redirect" = String, Query, description = "URL to redirect to after authentication completes.")
  ),
  responses(
    (status = StatusCode::SEE_OTHER, description = "Redirect to Google's OAuth authorization page."),
    (status = StatusCode::NOT_FOUND, description = "Google sign-in is not enabled.", body = String),
    (status = StatusCode::INTERNAL_SERVER_ERROR, description = "Failed to initiate the OAuth flow.", body = String)
  )
)]
pub(crate) async fn google_login(
  Query(params): Query<RedirectParams>,
  AppState(allowed_origins): AppState<AllowedOrigins>,
  AppState(clients): AppState<OAuthClients>,
  AppState(store): AppState<RedisSessionStore>,
) -> Result<Response> {
  authorize(Provider::Google, params, &allowed_origins, &clients, &store).await
}

async fn authorize(
  provider: Provider,
  params: RedirectParams,
  allowed_origins: &AllowedOrigins,
  clients: &OAuthClients,
  store: &RedisSessionStore,
) -> Result<Response> {
  let (auth_url, csrf_token) = clients
    .get(provider)?
    .authorize_url(CsrfToken::new_random)
    .add_scopes(
      provider
        .scopes()
        .iter()
        .map(|scope| Scope::new((*scope).to_string())),
    )
    .url();

  let mut session = Session::new();

  session
    .insert(CSRF_TOKEN, &csrf_token)
    .context("failed in inserting CSRF token into session")?;

  if let Some(redirect) = params.redirect {
    let redirect = allowed_origins.validate(&redirect)?;

    session
      .insert(REDIRECT_URL, redirect.as_str())
      .context("failed in inserting redirect into session")?;
  }

  let cookie = store
    .store_session(session)
    .await
    .context("failed to store CSRF token session")?
    .context("unexpected error retrieving CSRF cookie value")?;

  Ok(
    (session_cookie(&cookie)?, Redirect::to(auth_url.as_ref())).into_response(),
  )
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
  AppState(allowed_origins): AppState<AllowedOrigins>,
  AppState(db): AppState<Db>,
  AppState(store): AppState<RedisSessionStore>,
  AppState(clients): AppState<OAuthClients>,
  TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> Result<Response> {
  authorized(
    Provider::Github,
    query,
    &cookies,
    &allowed_origins,
    &clients,
    &db,
    &store,
  )
  .await
}

#[utoipa::path(
  get,
  path = "/auth/google/authorized",
  tag = "auth",
  description = "Complete the Google OAuth flow, validate state, and establish a user session.",
  params(
    ("code" = String, Query, description = "Authorization code returned by Google."),
    ("state" = String, Query, description = "Opaque state used to validate the CSRF token.")
  ),
  responses(
    (status = StatusCode::SEE_OTHER, description = "Redirect to the application after creating the session."),
    (status = StatusCode::NOT_FOUND, description = "Google sign-in is not enabled.", body = String),
    (status = StatusCode::INTERNAL_SERVER_ERROR, description = "Failed to exchange the authorization code or create the session.", body = String)
  )
)]
pub(crate) async fn google_authorized(
  Query(query): Query<AuthRequest>,
  AppState(allowed_origins): AppState<AllowedOrigins>,
  AppState(db): AppState<Db>,
  AppState(store): AppState<RedisSessionStore>,
  AppState(clients): AppState<OAuthClients>,
  TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> Result<Response> {
  authorized(
    Provider::Google,
    query,
    &cookies,
    &allowed_origins,
    &clients,
    &db,
    &store,
  )
  .await
}

async fn authorized(
  provider: Provider,
  query: AuthRequest,
  cookies: &headers::Cookie,
  allowed_origins: &AllowedOrigins,
  clients: &OAuthClients,
  db: &Db,
  store: &RedisSessionStore,
) -> Result<Response> {
  let client = clients.get(provider)?;

  let redirect = validate_csrf_token(&query, cookies, store).await?;

  let token = client
    .exchange_code(oauth2::AuthorizationCode::new(query.code))
    .request_async(&reqwest::Client::new())
    .await
    .context("failed in sending request request to authorization server")?;

  let Identity { email, name } =
    provider.identity(token.access_token().secret()).await?;

  let user = db
    .upsert_user(&email, name.as_deref())
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

  let Some(redirect) = redirect else {
    return Ok((session_cookie(&cookie)?, Redirect::to("/")).into_response());
  };

  let redirect = allowed_origins.validate(&redirect)?;

  let mut handoff = Session::new();

  handoff.expire_in(Duration::from_secs(60));

  handoff
    .insert(HANDOFF_COOKIE, &cookie)
    .context("failed in inserting cookie into handoff session")?;

  handoff
    .insert(REDIRECT_URL, redirect.as_str())
    .context("failed in inserting redirect into handoff session")?;

  let code = store
    .store_session(handoff)
    .await
    .context("failed to store handoff session")?
    .context("unexpected error retrieving handoff code")?;

  let mut exchange = redirect
    .join("/auth/exchange")
    .context("failed to build exchange URL")?;

  exchange.query_pairs_mut().append_pair("code", &code);

  Ok(Redirect::to(exchange.as_str()).into_response())
}

#[utoipa::path(
  get,
  path = "/auth/exchange",
  tag = "auth",
  params(("code" = String, Query)),
  responses((status = StatusCode::SEE_OTHER))
)]
pub(crate) async fn exchange(
  Query(params): Query<ExchangeParams>,
  AppState(store): AppState<RedisSessionStore>,
) -> Result<impl IntoResponse> {
  let handoff = store
    .load_session(params.code)
    .await
    .context("failed to load handoff session")?
    .context("handoff session not found")?;

  let cookie = handoff
    .get::<String>(HANDOFF_COOKIE)
    .context("cookie not found in handoff session")?;

  let redirect = handoff
    .get::<String>(REDIRECT_URL)
    .context("redirect not found in handoff session")?;

  store
    .destroy_session(handoff)
    .await
    .context("failed to destroy handoff session")?;

  Ok((session_cookie(&cookie)?, Redirect::to(&redirect)))
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
  AppState(allowed_origins): AppState<AllowedOrigins>,
  AppState(store): AppState<RedisSessionStore>,
  TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> Result<impl IntoResponse> {
  let redirect_target = match params.redirect {
    Some(redirect) => allowed_origins.validate(&redirect)?.to_string(),
    None => "/".to_string(),
  };

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
    (status = StatusCode::UNAUTHORIZED, description = "Not authenticated.")
  )
)]
pub(crate) async fn session(User(user): User) -> impl IntoResponse {
  Json(user)
}

#[utoipa::path(
  get,
  path = "/auth/providers",
  tag = "auth",
  description = "List the enabled sign-in providers.",
  responses(
    (status = StatusCode::OK, description = "Enabled sign-in providers.", body = Vec<Provider>)
  )
)]
pub(crate) async fn providers(
  AppState(clients): AppState<OAuthClients>,
) -> impl IntoResponse {
  Json(clients.providers())
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
