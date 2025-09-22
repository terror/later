use {
  anyhow::Error,
  axum::{Router, routing::get},
  dotenv::dotenv,
  sqlx::PgPool,
  std::{env, process},
  tokio::net::TcpListener,
  tracing::{error, info},
  tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt},
};

#[derive(Debug, Clone)]
struct State {
  _db: PgPool,
}

async fn run() -> Result {
  let database_url =
    env::var("DATABASE_URL").expect("DATABASE_URL must be set");

  info!("Connecting to database...");

  let pool = sqlx::PgPool::connect(&database_url).await?;

  sqlx::migrate!("./migrations").run(&pool).await?;

  info!("Database connected successfully");

  let state = State { _db: pool };

  let app = Router::new()
    .route("/", get(|| async { "Hello, World!" }))
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
