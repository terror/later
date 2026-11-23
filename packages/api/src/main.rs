use {
  allowed_origins::AllowedOrigins,
  anyhow::{Context, anyhow},
  async_session::{Session, SessionStore, async_trait, serde_json},
  auth::{COOKIE_NAME, Unauthorized},
  axum::{
    Json, RequestPartsExt, Router,
    body::Body,
    extract::{
      DefaultBodyLimit, FromRef, FromRequestParts, OptionalFromRequestParts,
      Query, State as AppState,
    },
    response::{IntoResponse, Redirect, Response},
    routing::get,
  },
  axum_extra::{
    TypedHeader, headers, typed_header::TypedHeaderRejectionReason,
  },
  chrono::{DateTime, Utc},
  clap::Parser,
  db::{ArticleContent, Db, NewArticle},
  documentation::Documentation,
  dotenv::dotenv,
  error::{BadRequest, Error},
  http::{
    HeaderMap, Request, StatusCode,
    header::{self, SET_COOKIE, USER_AGENT},
    request::Parts,
  },
  oauth2::{
    AuthUrl, ClientId, ClientSecret, CsrfToken, RedirectUrl, Scope,
    TokenResponse, TokenUrl, basic::BasicClient as OAuth2BasicClient,
  },
  readability::{Readability, ReadabilityOptions},
  redis::{
    AsyncCommands, Client, IntoConnectionInfo, RedisResult,
    aio::ConnectionManager,
  },
  redis_session_store::RedisSessionStore,
  reqwest::Url,
  serde::Deserialize,
  serde_json::Value,
  server::Server,
  state::State,
  std::{
    backtrace::BacktraceStatus,
    collections::HashSet,
    convert::Infallible,
    env,
    fmt::{self, Debug, Display, Formatter},
    net::SocketAddr,
    ops::Deref,
    process,
    sync::{Arc, LazyLock},
    thread,
    time::Duration,
  },
  tokio::{net::TcpListener, task},
  tower::ServiceBuilder,
  tower_governor::{GovernorLayer, governor::GovernorConfigBuilder},
  tower_http::{
    LatencyUnit,
    cors::CorsLayer,
    request_id::{
      MakeRequestUuid, PropagateRequestIdLayer, RequestId, SetRequestIdLayer,
    },
    trace::{
      DefaultOnFailure, DefaultOnRequest, DefaultOnResponse, TraceLayer,
    },
  },
  tracing::{Level, error, info, info_span, warn},
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
};

mod allowed_origins;
mod articles;
mod auth;
mod documentation;
mod error;
mod extraction;
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

  if env::var("ENV").unwrap_or_default() == "production" {
    tracing_subscriber::registry()
      .with(env_filter)
      .with(fmt_layer.json())
      .init();
  } else {
    tracing_subscriber::registry()
      .with(env_filter)
      .with(fmt_layer.pretty())
      .init();
  }

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
