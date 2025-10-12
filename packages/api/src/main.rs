use {
  anyhow::{Context, anyhow},
  async_session::{Session, SessionStore, async_trait, serde_json},
  auth::{AuthRedirect, COOKIE_NAME},
  axum::{
    RequestPartsExt, Router,
    body::Body,
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
  clap::Parser,
  documentation::Documentation,
  dotenv::dotenv,
  error::Error,
  http::{
    HeaderMap, Request, StatusCode,
    header::{self, SET_COOKIE},
    request::Parts,
  },
  oauth2::{
    AuthUrl, ClientId, ClientSecret, CsrfToken, RedirectUrl, Scope,
    TokenResponse, TokenUrl, basic::BasicClient as OAuth2BasicClient,
  },
  redis::{
    AsyncCommands, Client, IntoConnectionInfo, RedisResult,
    aio::ConnectionManager,
  },
  redis_session_store::RedisSessionStore,
  serde::{Deserialize, Serialize},
  server::Server,
  sqlx::PgPool,
  state::State,
  std::{
    backtrace::BacktraceStatus,
    convert::Infallible,
    env,
    fmt::{self, Debug, Display, Formatter},
    net::SocketAddr,
    process,
    time::Duration,
  },
  tokio::net::TcpListener,
  tower_http::{
    classify::ServerErrorsFailureClass, cors::CorsLayer, trace::TraceLayer,
  },
  tracing::{Span, error, info, info_span},
  tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt},
  user::User,
  utoipa::{
    Modify, OpenApi, ToSchema,
    openapi::{
      Components,
      security::{AuthorizationCode, Flow, OAuth2, Scopes, SecurityScheme},
    },
  },
  utoipa_scalar::{Scalar, Servable},
  uuid::Uuid,
};

mod auth;
mod documentation;
mod error;
mod redis_session_store;
mod server;
mod state;
mod user;

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

  if let Err(error) = Server::parse().run().await {
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
