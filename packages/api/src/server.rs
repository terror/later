use super::*;

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
    let database_url =
      env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    info!("Connecting to database...");

    let pool = PgPool::connect(&database_url).await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    info!("Database connected successfully");

    let redis_url = env::var("REDIS_URL")
      .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

    let session_store = RedisSessionStore::new(redis_url)
      .await
      .context("failed to create Redis session store")?;

    let oauth_client = auth::oauth_client()?;

    let state = State {
      _db: pool,
      oauth_client,
      session_store,
    };

    let router = Router::new()
      .route("/auth/authorized", get(auth::login_authorized))
      .route("/auth/login", get(auth::login))
      .route("/auth/logout", get(auth::logout))
      .merge(Scalar::with_url("/", Documentation::openapi()));

    let router = router.with_state(state)
      .layer(
        TraceLayer::new_for_http()
          .make_span_with(|request: &Request<Body>| {
            let request_id = Uuid::new_v4().to_string();

            info_span!(
              "http_request",
              method = %request.method(),
              path = %request.uri().path(),
              query = %request.uri().query().unwrap_or(""),
              request_id = %request_id,
              uri = %request.uri(),
              user_agent = %request
                .headers()
                .get("user-agent")
                .and_then(|header| header.to_str().ok())
                .unwrap_or("unknown"))
          })
          .on_request(|_request: &Request<Body>, span: &Span| {
            info!(parent: span, "request started");
          })
          .on_response(|response: &Response, latency: Duration, span: &Span| {
            info!(
              parent: span,
              status = %response.status(),
              latency_ms = %latency.as_millis(),
              "request completed"
            );
          })
          .on_failure(
            |error: ServerErrorsFailureClass,
             latency: Duration,
             span: &Span| {
              error!(
                parent: span,
                error = %error,
                latency_ms = %latency.as_millis(),
                "request failed"
              );
            },
          ),
      )
      .layer(CorsLayer::very_permissive());

    Ok(router)
  }
}
