use {
  aide::{
    axum::ApiRouter, openapi::OpenApi, scalar::Scalar,
    transform::TransformOpenApi,
  },
  anyhow::{Context, anyhow},
  async_session::{Session, SessionStore, async_trait, serde_json},
  auth::{AuthRedirect, COOKIE_NAME},
  axum::{
    Extension, Json, RequestPartsExt,
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
    backtrace::BacktraceStatus,
    convert::Infallible,
    env,
    fmt::{self, Debug, Display, Formatter},
    process,
    sync::Arc,
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

fn documentation_meta(api: TransformOpenApi) -> TransformOpenApi {
  api
    .title("later")
    .description(env!("CARGO_PKG_DESCRIPTION"))
    .version(env!("CARGO_PKG_VERSION"))
}

pub fn documentation_router() -> ApiRouter {
  aide::generate::infer_responses(true);

  let router = ApiRouter::new()
    .api_route_with(
      "/",
      aide::axum::routing::get_with(
        Scalar::new("/private/api.json")
          .with_title("later")
          .axum_handler(),
        |op| op.description(env!("CARGO_PKG_DESCRIPTION")),
      ),
      |p| p,
    )
    .route(
      "/private/api.json",
      aide::axum::routing::get(serve_documentation),
    );

  aide::generate::infer_responses(false);

  router
}

async fn serve_documentation(
  axum::Extension(api): axum::Extension<Arc<OpenApi>>,
) -> impl aide::axum::IntoApiResponse {
  Json(api).into_response()
}

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

  aide::generate::on_error(|error| {
    error!("failed to generate OpenAPI spec: {error}");
  });

  aide::generate::extract_schemas(true);

  let mut api = OpenApi::default();

  let app = ApiRouter::new()
    .route("/auth/authorized", get(auth::login_authorized))
    .route("/auth/login", get(auth::login))
    .route("/auth/logout", get(auth::logout))
    .fallback_service(documentation_router())
    .finish_api_with(&mut api, documentation_meta)
    .layer(Extension(Arc::new(api)))
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

    for (i, error) in error.0.chain().skip(1).enumerate() {
      if i == 0 {
        eprintln!();
        eprintln!("because:");
      }

      eprintln!("- {error}");
    }

    let backtrace = error.0.backtrace();

    if backtrace.status() == BacktraceStatus::Captured {
      eprintln!("backtrace:");
      eprintln!("{backtrace}");
    }

    process::exit(1);
  }
}
