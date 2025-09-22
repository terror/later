use {
  axum::{Router, routing::get},
  tracing::info,
  tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt},
};

#[tokio::main]
async fn main() {
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

  let app = Router::new().route("/", get(|| async { "Hello, World!" }));

  let listener = tokio::net::TcpListener::bind("0.0.0.0:80").await.unwrap();

  info!("Starting server on 0.0.0.0:80");

  axum::serve(listener, app).await.unwrap();
}
