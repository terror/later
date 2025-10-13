use {super::*, model::{NewUser, User}, sqlx::migrate::MigrateDatabase};

#[derive(Debug, Clone)]
pub struct Db {
  pool: PgPool,
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

    Ok(Self { pool })
  }

  pub fn pool(&self) -> &PgPool {
    &self.pool
  }

  pub async fn upsert_user(&self, new_user: NewUser) -> Result<User> {
    let NewUser {
      github_id,
      email,
      username,
      name,
      avatar_url,
    } = new_user;

    let user = sqlx::query_as::<_, User>(
      r#"
      INSERT INTO users (github_id, email, username, name, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (github_id) DO UPDATE
      SET email = EXCLUDED.email,
          username = EXCLUDED.username,
          name = EXCLUDED.name,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = NOW()
      RETURNING
        user_id,
        github_id,
        email,
        username,
        name,
        avatar_url,
        created_at,
        updated_at
      "#,
    )
    .bind(github_id)
    .bind(email)
    .bind(username)
    .bind(name)
    .bind(avatar_url)
    .fetch_one(&self.pool)
    .await?;

    Ok(user)
  }

  pub async fn user_count(&self) -> Result<i64> {
    Ok(
      sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
        .fetch_one(&self.pool)
        .await?,
    )
  }
}

#[cfg(test)]
mod tests {
  use {
    super::*,
    std::{
      env,
      sync::atomic::{AtomicUsize, Ordering},
      time::{SystemTime, UNIX_EPOCH},
    },
    url::Url,
  };

  struct TestContext {
    db: Db,
    database_url: String,
  }

  impl TestContext {
    async fn new() -> Self {
      static TEST_DATABASE_NUMBER: AtomicUsize = AtomicUsize::new(0);

      let test_database_number =
        TEST_DATABASE_NUMBER.fetch_add(1, Ordering::Relaxed);

      let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();

      let db_name = format!("later-test-{timestamp}-{test_database_number}");

      let base_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://postgres:password@localhost:5432/later".into()
      });

      let mut url =
        Url::parse(&base_url).expect("invalid DATABASE_URL for tests");
      url.set_path(&db_name);

      let database_url = url.to_string();

      let db = Db::connect(&database_url)
        .await
        .expect("failed to connect to db");

      Self { db, database_url }
    }
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn on_disk_database_is_persistent() {
    let TestContext { db, database_url } = TestContext::new().await;

    assert_eq!(db.user_count().await.unwrap(), 0);

    db.upsert_user(NewUser {
      github_id: 42,
      email: Some("test@example.com".into()),
      username: "test-user".into(),
      name: Some("Test User".into()),
      avatar_url: Some("https://example.com/avatar.png".into()),
    })
    .await
    .unwrap();

    assert_eq!(db.user_count().await.unwrap(), 1);

    drop(db);

    let db = Db::connect(&database_url).await.unwrap();

    assert_eq!(db.user_count().await.unwrap(), 1);
  }
}
