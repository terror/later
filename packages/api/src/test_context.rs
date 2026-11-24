use {
  super::*,
  http::Method,
  sqlx::{Postgres, migrate::MigrateDatabase},
  std::{
    sync::atomic::{AtomicUsize, Ordering},
    time::{SystemTime, UNIX_EPOCH},
  },
  tower::ServiceExt,
};

pub(crate) struct TestContext {
  pub(crate) db: Db,
  router: Router,
  token: String,
  pub(crate) user: model::User,
}

impl TestContext {
  pub(crate) async fn new() -> Self {
    Self::with_burst_size(1000).await
  }

  pub(crate) async fn with_burst_size(burst_size: u32) -> Self {
    static TEST_DATABASE_NUMBER: AtomicUsize = AtomicUsize::new(0);

    let test_database_number =
      TEST_DATABASE_NUMBER.fetch_add(1, Ordering::Relaxed);

    let timestamp = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_millis();

    let db_name = format!("later-api-test-{timestamp}-{test_database_number}");

    let mut url = Url::parse(&env::var("DATABASE_URL").unwrap_or_else(|_| {
      "postgresql://postgres:password@localhost:5432/later".into()
    }))
    .unwrap();

    url.set_path(&db_name);

    Postgres::create_database(url.as_str()).await.unwrap();

    let db = Db::connect(url.as_str()).await.unwrap();

    let session_store = RedisSessionStore::new_with_prefix(
      env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".into()),
      format!("session:{db_name}:"),
    )
    .await
    .unwrap();

    let oauth_client = OAuth2BasicClient::new(ClientId::new("foo".into()))
      .set_client_secret(ClientSecret::new("bar".into()))
      .set_auth_uri(AuthUrl::new("https://foo.com/authorize".into()).unwrap())
      .set_token_uri(TokenUrl::new("https://foo.com/token".into()).unwrap())
      .set_redirect_uri(
        RedirectUrl::new("https://foo.com/authorized".into()).unwrap(),
      );

    let governor_config = Arc::new(
      GovernorConfigBuilder::default()
        .per_second(60)
        .burst_size(burst_size)
        .key_extractor(RateLimitKeyExtractor { trusted_proxies: 0 })
        .use_headers()
        .finish()
        .unwrap(),
    );

    let router = Server::service(
      State {
        allowed_origins: AllowedOrigins::new("https://foo.com"),
        db: db.clone(),
        oauth_client,
        session_store,
      },
      governor_config,
    );

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let token = ApiToken::generate().into_inner();

    db.create_api_token(user.user_id, &ApiToken::hash(&token))
      .await
      .unwrap();

    Self {
      db,
      router,
      token,
      user,
    }
  }

  pub(crate) async fn user(&self, email: &str) -> (model::User, String) {
    let user = self.db.upsert_user(email, None).await.unwrap();

    let token = ApiToken::generate().into_inner();

    self
      .db
      .create_api_token(user.user_id, &ApiToken::hash(&token))
      .await
      .unwrap();

    (user, format!("Bearer {token}"))
  }

  pub(crate) async fn request(
    &self,
    method: Method,
    path: &str,
    body: Option<Value>,
  ) -> (StatusCode, String) {
    self
      .status_and_body(
        Request::builder()
          .method(method)
          .uri(path)
          .header(header::AUTHORIZATION, format!("Bearer {}", self.token))
          .header(header::CONTENT_TYPE, "application/json")
          .body(
            body.map_or_else(Body::empty, |body| Body::from(body.to_string())),
          )
          .unwrap(),
      )
      .await
  }

  pub(crate) async fn send(&self, mut request: Request<Body>) -> Response {
    request
      .extensions_mut()
      .insert(ConnectInfo(SocketAddr::from(([127, 0, 0, 1], 80))));

    self.router.clone().oneshot(request).await.unwrap()
  }

  pub(crate) async fn status_and_body(
    &self,
    request: Request<Body>,
  ) -> (StatusCode, String) {
    let response = self.send(request).await;

    let status = response.status();

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
      .await
      .unwrap();

    (status, String::from_utf8(body.to_vec()).unwrap())
  }
}
