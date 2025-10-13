use {super::*, sqlx::migrate::MigrateDatabase};

#[derive(Debug, Clone)]
pub struct Db {
  _pool: PgPool,
}

impl Db {
  pub async fn connect(database_url: &str) -> Result<Self> {
    if !sqlx::Postgres::database_exists(database_url).await? {
      sqlx::Postgres::create_database(database_url).await?;
    }

    let pool = PgPool::connect(database_url).await?;

    sqlx::migrate!("./migrations")
      .run(&pool)
      .await
      .map_err(Error::Migrate)?;

    Ok(Self { _pool: pool })
  }
}
