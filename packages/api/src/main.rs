use {
  anyhow::{Context, anyhow},
  async_session::{Session, SessionStore, async_trait, serde_json},
  auth::{AuthRedirect, COOKIE_NAME},
  axum::{
    RequestPartsExt, Router,
    extract::{
      FromRef, FromRequestParts, OptionalFromRequestParts, Query,
      State as AppState,
    },
    response::{IntoResponse, Redirect, Response},
    routing::get,
  },
  axum_extra::{
    TypedHeader, headers, typed_header::TypedHeaderRejectionReason,
  },
  dotenv::dotenv,
  error::Error,
  http::{
    HeaderMap, StatusCode,
    header::{self, SET_COOKIE},
    request::Parts,
  },
  oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, RedirectUrl,
    Scope, TokenResponse, TokenUrl, basic::BasicClient as OAuth2BasicClient,
  },
  redis::{
    AsyncCommands, Client, IntoConnectionInfo, RedisResult,
    aio::ConnectionManager,
  },
  redis_session_store::RedisSessionStore,
  serde::{Deserialize, Serialize},
  sqlx::PgPool,
  state::State,
  std::{
    convert::Infallible,
    env,
    fmt::{self, Debug, Display, Formatter},
    process,
  },
  tokio::net::TcpListener,
  tracing::{error, info},
  tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt},
  user::User,
};

mod auth;
mod error;
mod redis_session_store;
mod state;
mod user;

async fn run() -> Result {
  let database_url =
    env::var("DATABASE_URL").expect("DATABASE_URL must be set");

  info!("Connecting to database...");

  let pool = sqlx::PgPool::connect(&database_url).await?;

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

  let app = Router::new()
    .route("/auth/authorized", get(auth::login_authorized))
    .route("/auth/login", get(auth::login))
    .route("/auth/logout", get(auth::logout))
    .with_state(state);

  let listener = TcpListener::bind("0.0.0.0:80").await?;

  info!("Starting server on 0.0.0.0:80");

  axum::serve(listener, app).await?;

  Ok(())
}

type Result<T = (), E = Error> = std::result::Result<T, E>;

#[tokio::main]
async fn main() {
  dotenv().ok();

  let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
    .unwrap_or_else(|_| "info,tower_http=debug,hyper=debug".into());

  let fmt_layer = tracing_subscriber::fmt::layer()
    .with_target(true)
    .with_thread_ids(true)
    .with_file(true)
    .with_line_number(true);

  tracing_subscriber::registry()
    .with(env_filter)
    .with(fmt_layer.pretty())
    .init();

  if let Err(error) = run().await {
    error!("error: {error}");
    process::exit(1);
  }
}
