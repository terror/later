use super::*;

const MAX_BODY_BYTES: usize = 10 * 1024 * 1024;

#[derive(Debug, Parser)]
pub(crate) struct Server {
  #[clap(short, long, default_value = "80", help = "Port to listen on")]
  port: u16,
}

impl Server {
  pub(crate) async fn run(self) -> Result {
    let addr = SocketAddr::from(([0, 0, 0, 0], self.port));

    info!("Listening on port: {}", addr.port());

    let app = Self::app().await?;

    axum::serve(
      TcpListener::bind(addr).await?,
      app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
  }

  async fn app() -> Result<Router> {
    let database_url = env::var("DATABASE_URL")
      .unwrap_or("postgresql://postgres:password@localhost:5432/later".into());

    info!("Connecting to database...");

    let db = Db::connect(&database_url).await?;

    info!("Database connected successfully");

    let redis_url =
      env::var("REDIS_URL").unwrap_or("redis://127.0.0.1:6379".into());

    let session_store = RedisSessionStore::new(redis_url)
      .await
      .context("failed to create Redis session store")?;

    let oauth_client = auth::oauth_client()?;

    let trusted_proxies = env::var("TRUSTED_PROXIES")
      .ok()
      .map(|value| value.parse::<usize>())
      .transpose()
      .context("TRUSTED_PROXIES must be a non-negative integer")?
      .unwrap_or_default();

    let allowed_origins = AllowedOrigins::new(
      &env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:5173".into()),
    );

    let state = State {
      allowed_origins,
      db,
      oauth_client,
      session_store,
    };

    let governor_config = Arc::new(
      GovernorConfigBuilder::default()
        .per_second(10)
        .burst_size(100)
        .key_extractor(RateLimitKeyExtractor { trusted_proxies })
        .use_headers()
        .finish()
        .ok_or(anyhow!("failed to build governor config"))?,
    );

    let governor_limiter = governor_config.limiter().clone();

    let interval = Duration::from_secs(60);

    thread::spawn(move || {
      loop {
        thread::sleep(interval);
        governor_limiter.retain_recent();
      }
    });

    Ok(Self::service(state, governor_config))
  }

  pub(crate) fn service(
    state: State,
    governor_config: Arc<
      GovernorConfig<RateLimitKeyExtractor, StateInformationMiddleware>,
    >,
  ) -> Router {
    let allowed_origins = state.allowed_origins.clone();

    let cors = CorsLayer::new()
      .allow_origin(AllowOrigin::predicate(move |origin, _| {
        origin
          .to_str()
          .is_ok_and(|origin| allowed_origins.allows(origin))
      }))
      .allow_credentials(true)
      .allow_methods([
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::PATCH,
        Method::DELETE,
      ])
      .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE]);

    let trace_layer = TraceLayer::new_for_http()
      .make_span_with(|request: &Request<Body>| {
        let request_id = request
          .extensions()
          .get::<RequestId>()
          .and_then(|request_id| request_id.header_value().to_str().ok())
          .unwrap_or("missing-request-id");

        let user_agent = request
          .headers()
          .get(USER_AGENT)
          .and_then(|header| header.to_str().ok())
          .unwrap_or("unknown");

        info_span!(
          "http_request",
          method = %request.method(),
          request_id = %request_id,
          uri = %request.uri(),
          user_agent = %user_agent,
        )
      })
      .on_request(DefaultOnRequest::new().level(Level::INFO))
      .on_response(
        DefaultOnResponse::new()
          .level(Level::INFO)
          .latency_unit(LatencyUnit::Millis),
      )
      .on_failure(DefaultOnFailure::new().level(Level::ERROR));

    let middleware = ServiceBuilder::new()
      .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid))
      .layer(trace_layer)
      .layer(PropagateRequestIdLayer::x_request_id())
      .layer(cors)
      .layer(middleware::from_fn_with_state(
        state.clone(),
        rate_limit::authenticate,
      ))
      .layer(GovernorLayer::new(governor_config));

    Self::router().with_state(state).layer(middleware)
  }

  pub(crate) fn router() -> Router<State> {
    Router::new()
      .route(
        "/articles",
        get(articles::list)
          .post(articles::save)
          .layer(DefaultBodyLimit::max(MAX_BODY_BYTES)),
      )
      .route(
        "/articles/{article_id}",
        get(articles::get)
          .patch(articles::update)
          .delete(articles::delete),
      )
      .route(
        "/articles/{article_id}/progress",
        put(articles::save_progress),
      )
      .route(
        "/articles/{article_id}/highlights",
        get(highlights::list).post(highlights::create),
      )
      .route(
        "/articles/{article_id}/highlights/{highlight_id}",
        patch(highlights::update).delete(highlights::delete),
      )
      .route("/auth/authorized", get(auth::login_authorized))
      .route("/auth/exchange", get(auth::exchange))
      .route("/auth/login", get(auth::login))
      .route("/auth/logout", get(auth::logout))
      .route("/auth/session", get(auth::session))
      .route("/tokens", post(tokens::create).delete(tokens::delete))
      .merge(Scalar::with_url("/", Documentation::openapi()))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn get(uri: &str) -> Request<Body> {
    Request::get(uri).body(Body::empty()).unwrap()
  }

  fn with_header(
    mut request: Request<Body>,
    name: &'static str,
    value: &str,
  ) -> Request<Body> {
    request.headers_mut().insert(name, value.parse().unwrap());
    request
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn errors() {
    let context = TestContext::new().await;

    let (_, authorization) = context.user("foo@bar.com").await;

    let requests = [
      get("/articles"),
      with_header(get("/articles"), "cookie", "SESSION=foo"),
      with_header(get("/articles"), "cookie", "SESSION=Zm9v"),
      with_header(get("/articles"), "authorization", "Bearer foo"),
      with_header(get("/articles"), "authorization", "foo"),
      with_header(get("/articles?limit=0"), "authorization", &authorization),
      with_header(get("/articles?cursor=foo"), "authorization", &authorization),
      Request::delete("/tokens").body(Body::empty()).unwrap(),
      get("/auth/exchange?code=foo"),
      get("/auth/login?redirect=https://bar.com/"),
      with_header(
        get("/auth/authorized?code=foo&state=bar"),
        "cookie",
        "foo=bar",
      ),
      with_header(
        get("/auth/authorized?code=foo&state=bar"),
        "cookie",
        "SESSION=foo",
      ),
    ];

    let mut responses = Vec::new();

    for request in requests {
      responses.push(context.status_and_body(request).await);
    }

    let unauthorized = (StatusCode::UNAUTHORIZED, "error: unauthorized".into());

    let bad_request =
      |message: &str| (StatusCode::BAD_REQUEST, format!("error: {message}"));

    assert_eq!(
      responses,
      [
        unauthorized.clone(),
        unauthorized.clone(),
        unauthorized.clone(),
        unauthorized.clone(),
        unauthorized.clone(),
        bad_request("limit must be between 1 and 100"),
        bad_request("invalid cursor `foo`"),
        unauthorized,
        bad_request("invalid or expired code"),
        bad_request("redirect origin `https://bar.com` is not allowed"),
        bad_request("missing session cookie"),
        bad_request("session not found"),
      ],
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn login_and_logout() {
    let context = TestContext::new().await;

    let response = context.send(get("/auth/login")).await;

    let cookie = response.headers()[SET_COOKIE].to_str().unwrap().to_string();

    let (session, attributes) = cookie.split_once("; ").unwrap();

    assert_eq!(attributes, "SameSite=Lax; HttpOnly; Path=/; Max-Age=600");

    assert_eq!(
      context
        .status_and_body(with_header(
          get("/auth/authorized?code=foo&state=bar"),
          "cookie",
          session,
        ))
        .await,
      (StatusCode::BAD_REQUEST, "error: CSRF token mismatch".into()),
    );

    let response = context
      .send(with_header(get("/auth/logout"), "cookie", session))
      .await;

    assert_eq!(
      (
        response.status(),
        response.headers()[SET_COOKIE].to_str().unwrap(),
        response.headers()[header::LOCATION].to_str().unwrap(),
      ),
      (
        StatusCode::SEE_OTHER,
        "SESSION=; SameSite=Lax; HttpOnly; Path=/; Max-Age=0",
        "/",
      ),
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn cors() {
    let context = TestContext::new().await;

    let preflight = |origin: &str| {
      Request::options("/articles")
        .header(header::ORIGIN, origin)
        .header(header::ACCESS_CONTROL_REQUEST_METHOD, "DELETE")
        .header(header::ACCESS_CONTROL_REQUEST_HEADERS, "authorization")
        .body(Body::empty())
        .unwrap()
    };

    let mut headers = Vec::new();

    for origin in ["https://foo.com", "https://bar.com"] {
      let response = context.send(preflight(origin)).await;

      headers.push(
        [
          header::ACCESS_CONTROL_ALLOW_ORIGIN,
          header::ACCESS_CONTROL_ALLOW_CREDENTIALS,
          header::ACCESS_CONTROL_ALLOW_METHODS,
          header::ACCESS_CONTROL_ALLOW_HEADERS,
        ]
        .map(|name| {
          response
            .headers()
            .get(name)
            .map(|value| value.to_str().unwrap().to_string())
        }),
      );
    }

    assert_eq!(
      headers,
      [
        [
          Some("https://foo.com".into()),
          Some("true".into()),
          Some("GET,POST,PUT,PATCH,DELETE".into()),
          Some("authorization,content-type".into()),
        ],
        [
          None,
          Some("true".into()),
          Some("GET,POST,PUT,PATCH,DELETE".into()),
          Some("authorization,content-type".into()),
        ],
      ],
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn rate_limit() {
    let context = TestContext::with_burst_size(1).await;

    let (_, foo) = context.user("foo@bar.com").await;

    let (_, bar) = context.user("bar@baz.com").await;

    let requests = [
      with_header(get("/auth/session"), "authorization", &foo),
      with_header(get("/auth/session"), "authorization", &foo),
      with_header(get("/auth/session"), "authorization", &bar),
      get("/auth/session"),
      get("/auth/session"),
    ];

    let mut statuses = Vec::new();

    for request in requests {
      statuses.push(context.send(request).await.status());
    }

    assert_eq!(
      statuses,
      [
        StatusCode::OK,
        StatusCode::TOO_MANY_REQUESTS,
        StatusCode::OK,
        StatusCode::UNAUTHORIZED,
        StatusCode::TOO_MANY_REQUESTS,
      ],
    );
  }
}
