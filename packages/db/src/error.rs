#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error("failed to run database migrations")]
  Migrate(#[source] sqlx::migrate::MigrateError),
  #[error(transparent)]
  Sqlx(#[from] sqlx::Error),
}
