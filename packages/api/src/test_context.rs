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
    static TEST_DATABASE_NUMBER: AtomicUsize = AtomicUsize::new(0);

    let test_database_number =
      TEST_DATABASE_NUMBER.fetch_add(1, Ordering::Relaxed);

    let timestamp = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_millis();

    let mut url = Url::parse(&env::var("DATABASE_URL").unwrap_or_else(|_| {
      "postgresql://postgres:password@localhost:5432/later".into()
    }))
    .unwrap();

    url.set_path(&format!(
      "later-api-test-{timestamp}-{test_database_number}"
    ));

    Postgres::create_database(url.as_str()).await.unwrap();

    let db = Db::connect(url.as_str()).await.unwrap();

    let session_store = RedisSessionStore::new(
      env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".into()),
    )
    .await
    .unwrap();

    let oauth_client = OAuth2BasicClient::new(ClientId::new("foo".into()))
      .set_auth_uri(AuthUrl::new("https://foo.com/auth".into()).unwrap())
      .set_token_uri(TokenUrl::new("https://foo.com/token".into()).unwrap());

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let token = ApiToken::generate().into_inner();

    db.create_api_token(user.user_id, &ApiToken::hash(&token))
      .await
      .unwrap();

    let router = Server::router().with_state(State {
      allowed_origins: AllowedOrigins::new(""),
      db: db.clone(),
      oauth_client,
      session_store,
    });

    Self {
      db,
      router,
      token,
      user,
    }
  }

  pub(crate) async fn request(
    &self,
    method: Method,
    path: &str,
    body: Option<Value>,
  ) -> (StatusCode, String) {
    let request = Request::builder()
      .method(method)
      .uri(path)
      .header(header::AUTHORIZATION, format!("Bearer {}", self.token))
      .header(header::CONTENT_TYPE, "application/json")
      .body(body.map_or_else(Body::empty, |body| Body::from(body.to_string())))
      .unwrap();

    let response = self.router.clone().oneshot(request).await.unwrap();

    let status = response.status();

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
      .await
      .unwrap();

    (status, String::from_utf8(body.to_vec()).unwrap())
  }
}
