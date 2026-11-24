use super::*;

#[derive(Debug, Clone)]
pub struct Db {
  pool: PgPool,
}

impl Db {
  pub async fn connect(database_url: &str) -> Result<Self> {
    let pool = PgPool::connect(database_url).await?;

    sqlx::migrate!("./migrations")
      .run(&pool)
      .await
      .map_err(Error::Migrate)?;

    Ok(Self { pool })
  }

  pub async fn api_token_user(
    &self,
    token_hash: &[u8],
  ) -> Result<Option<User>> {
    Ok(
      sqlx::query_as::<_, User>(
        r#"
      SELECT
        users.user_id,
        users.email,
        users.name,
        users.created_at,
        users.updated_at
      FROM api_tokens
      JOIN users ON users.user_id = api_tokens.user_id
      WHERE api_tokens.token_hash = $1
      "#,
      )
      .bind(token_hash)
      .fetch_optional(&self.pool)
      .await?,
    )
  }

  pub async fn articles(&self, user_id: Uuid) -> Result<Vec<Article>> {
    Ok(
      sqlx::query_as::<_, Article>(
        r#"
      SELECT
        article_id,
        url,
        title,
        author,
        excerpt,
        site_name,
        lang,
        dir,
        publication_date,
        word_count,
        reading_time_minutes,
        is_archived,
        is_favorited,
        date_saved,
        date_read
      FROM articles
      WHERE user_id = $1
      ORDER BY date_saved DESC
      "#,
      )
      .bind(user_id)
      .fetch_all(&self.pool)
      .await?,
    )
  }

  pub async fn create_api_token(
    &self,
    user_id: Uuid,
    token_hash: &[u8],
  ) -> Result {
    sqlx::query("INSERT INTO api_tokens (user_id, token_hash) VALUES ($1, $2)")
      .bind(user_id)
      .bind(token_hash)
      .execute(&self.pool)
      .await?;

    Ok(())
  }

  pub async fn delete_api_token(&self, token_hash: &[u8]) -> Result<bool> {
    Ok(
      sqlx::query("DELETE FROM api_tokens WHERE token_hash = $1")
        .bind(token_hash)
        .execute(&self.pool)
        .await?
        .rows_affected()
        > 0,
    )
  }

  pub async fn save_article(
    &self,
    article: &NewArticle<'_>,
  ) -> Result<(Article, bool)> {
    #[derive(FromRow)]
    struct Saved {
      #[sqlx(flatten)]
      article: Article,
      created: bool,
    }

    let content = article.content.as_ref();

    let saved = sqlx::query_as::<_, Saved>(
      r#"
      INSERT INTO articles (
        user_id,
        url,
        normalized_url,
        html,
        title,
        author,
        excerpt,
        site_name,
        lang,
        dir,
        publication_date,
        content,
        text_content,
        word_count,
        reading_time_minutes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (user_id, normalized_url) DO UPDATE
      SET url = EXCLUDED.url,
        html = COALESCE(EXCLUDED.html, articles.html),
        title = CASE WHEN EXCLUDED.content IS NULL THEN articles.title ELSE EXCLUDED.title END,
        author = CASE WHEN EXCLUDED.content IS NULL THEN articles.author ELSE EXCLUDED.author END,
        excerpt = CASE WHEN EXCLUDED.content IS NULL THEN articles.excerpt ELSE EXCLUDED.excerpt END,
        site_name = CASE WHEN EXCLUDED.content IS NULL THEN articles.site_name ELSE EXCLUDED.site_name END,
        lang = CASE WHEN EXCLUDED.content IS NULL THEN articles.lang ELSE EXCLUDED.lang END,
        dir = CASE WHEN EXCLUDED.content IS NULL THEN articles.dir ELSE EXCLUDED.dir END,
        publication_date = CASE WHEN EXCLUDED.content IS NULL THEN articles.publication_date ELSE EXCLUDED.publication_date END,
        content = CASE WHEN EXCLUDED.content IS NULL THEN articles.content ELSE EXCLUDED.content END,
        text_content = CASE WHEN EXCLUDED.content IS NULL THEN articles.text_content ELSE EXCLUDED.text_content END,
        word_count = CASE WHEN EXCLUDED.content IS NULL THEN articles.word_count ELSE EXCLUDED.word_count END,
        reading_time_minutes = CASE WHEN EXCLUDED.content IS NULL THEN articles.reading_time_minutes ELSE EXCLUDED.reading_time_minutes END,
        is_archived = FALSE,
        date_saved = NOW()
      RETURNING
        (xmax = 0) AS created,
        article_id,
        url,
        title,
        author,
        excerpt,
        site_name,
        lang,
        dir,
        publication_date,
        word_count,
        reading_time_minutes,
        is_archived,
        is_favorited,
        date_saved,
        date_read
      "#,
    )
    .bind(article.user_id)
    .bind(article.url)
    .bind(article.normalized_url)
    .bind(article.html)
    .bind(content.and_then(|content| content.title.as_deref()))
    .bind(content.and_then(|content| content.author.as_deref()))
    .bind(content.and_then(|content| content.excerpt.as_deref()))
    .bind(content.and_then(|content| content.site_name.as_deref()))
    .bind(content.and_then(|content| content.lang.as_deref()))
    .bind(content.and_then(|content| content.dir.as_deref()))
    .bind(content.and_then(|content| content.publication_date))
    .bind(content.map(|content| content.content.as_str()))
    .bind(content.map(|content| content.text_content.as_str()))
    .bind(content.map(|content| content.word_count))
    .bind(content.map(|content| content.reading_time_minutes))
    .fetch_one(&self.pool)
    .await?;

    Ok((saved.article, saved.created))
  }

  pub async fn upsert_user(
    &self,
    email: &str,
    name: Option<&str>,
  ) -> Result<User> {
    Ok(
      sqlx::query_as::<_, User>(
        r#"
      INSERT INTO users (email, name)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE
      SET email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = NOW()
      RETURNING
        user_id,
        email,
        name,
        created_at,
        updated_at
      "#,
      )
      .bind(email)
      .bind(name)
      .fetch_one(&self.pool)
      .await?,
    )
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
    sqlx::{Postgres, migrate::MigrateDatabase},
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

      if !Postgres::database_exists(&database_url).await.unwrap() {
        Postgres::create_database(&database_url).await.unwrap();
      }

      let db = Db::connect(&database_url)
        .await
        .expect("failed to connect to db");

      Self { db, database_url }
    }
  }

  fn new_article(
    user_id: Uuid,
    content: Option<ArticleContent>,
  ) -> NewArticle<'static> {
    NewArticle {
      content,
      html: Some("<p>foo</p>"),
      normalized_url: "https://foo.com/bar",
      url: "https://foo.com/bar?utm_source=baz",
      user_id,
    }
  }

  fn content() -> ArticleContent {
    ArticleContent {
      author: Some("bar".into()),
      content: "<p>baz</p>".into(),
      dir: None,
      excerpt: Some("baz".into()),
      lang: Some("en".into()),
      publication_date: None,
      reading_time_minutes: 1,
      site_name: Some("foo".into()),
      text_content: "baz".into(),
      title: Some("foo".into()),
      word_count: 1,
    }
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn api_tokens() {
    let TestContext { db, .. } = TestContext::new().await;

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    assert_eq!(db.api_token_user(b"foo").await.unwrap(), None);

    db.create_api_token(user.user_id, b"foo").await.unwrap();

    assert_eq!(db.api_token_user(b"foo").await.unwrap(), Some(user));

    assert!(db.delete_api_token(b"foo").await.unwrap());

    assert!(!db.delete_api_token(b"foo").await.unwrap());

    assert_eq!(db.api_token_user(b"foo").await.unwrap(), None);
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn save_article() {
    let TestContext { db, .. } = TestContext::new().await;

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let (saved, created) = db
      .save_article(&new_article(user.user_id, Some(content())))
      .await
      .unwrap();

    assert!(created);

    assert_eq!(
      (
        saved.url.as_str(),
        saved.title.as_deref(),
        saved.author.as_deref(),
        saved.word_count,
      ),
      (
        "https://foo.com/bar?utm_source=baz",
        Some("foo"),
        Some("bar"),
        Some(1)
      ),
    );

    let (resaved, created) = db
      .save_article(&new_article(user.user_id, None))
      .await
      .unwrap();

    assert!(!created);

    assert_eq!(
      resaved,
      Article {
        date_saved: resaved.date_saved,
        ..saved.clone()
      },
    );

    assert_eq!(db.articles(user.user_id).await.unwrap(), vec![resaved]);
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn on_disk_database_is_persistent() {
    let TestContext { db, database_url } = TestContext::new().await;

    assert_eq!(db.user_count().await.unwrap(), 0);

    db.upsert_user("test@example.com", Some("Test User"))
      .await
      .unwrap();

    assert_eq!(db.user_count().await.unwrap(), 1);

    drop(db);

    let db = Db::connect(&database_url).await.unwrap();

    assert_eq!(db.user_count().await.unwrap(), 1);
  }
}
