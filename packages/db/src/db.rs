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

  pub async fn article(
    &self,
    user_id: Uuid,
    article_id: Uuid,
  ) -> Result<Option<ArticleWithContent>> {
    Ok(
      sqlx::query_as::<_, ArticleWithContent>(
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
        date_read,
        content,
        COALESCE(scroll_position, 0)::FLOAT8 AS scroll_position,
        COALESCE(time_spent_seconds, 0) AS time_spent_seconds
      FROM articles
      LEFT JOIN reading_progress USING (article_id, user_id)
      WHERE user_id = $1 AND article_id = $2
      "#,
      )
      .bind(user_id)
      .bind(article_id)
      .fetch_optional(&self.pool)
      .await?,
    )
  }

  pub async fn article_text(
    &self,
    user_id: Uuid,
    article_id: Uuid,
  ) -> Result<Option<String>> {
    Ok(
      sqlx::query_scalar::<_, String>(
        r#"
      SELECT COALESCE(text_content, '')
      FROM articles
      WHERE user_id = $1 AND article_id = $2
      "#,
      )
      .bind(user_id)
      .bind(article_id)
      .fetch_optional(&self.pool)
      .await?,
    )
  }

  pub async fn articles(
    &self,
    user_id: Uuid,
    before: Option<(DateTime<Utc>, Uuid)>,
    limit: i64,
  ) -> Result<Vec<Article>> {
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
        date_read,
        COALESCE(scroll_position, 0)::FLOAT8 AS scroll_position,
        COALESCE(time_spent_seconds, 0) AS time_spent_seconds
      FROM articles
      LEFT JOIN reading_progress USING (article_id, user_id)
      WHERE user_id = $1
        AND (
          $2::timestamptz IS NULL
          OR (date_saved, article_id) < ($2::timestamptz, $3::uuid)
        )
      ORDER BY date_saved DESC, article_id DESC
      LIMIT $4
      "#,
      )
      .bind(user_id)
      .bind(before.map(|(date_saved, _)| date_saved))
      .bind(before.map(|(_, article_id)| article_id))
      .bind(limit)
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

  pub async fn create_highlight(
    &self,
    highlight: &NewHighlight<'_>,
  ) -> Result<Option<Highlight>> {
    Ok(
      sqlx::query_as::<_, Highlight>(
        r#"
      INSERT INTO highlights (
        article_id,
        user_id,
        selected_text,
        context_before,
        context_after,
        start_offset,
        end_offset
      )
      SELECT article_id, user_id, $3, $4, $5, $6, $7
      FROM articles
      WHERE user_id = $1 AND article_id = $2
      RETURNING
        highlight_id,
        article_id,
        selected_text,
        context_before,
        context_after,
        start_offset,
        end_offset,
        color,
        note,
        created_at,
        updated_at
      "#,
      )
      .bind(highlight.user_id)
      .bind(highlight.article_id)
      .bind(highlight.selected_text)
      .bind(highlight.context_before)
      .bind(highlight.context_after)
      .bind(highlight.start_offset)
      .bind(highlight.end_offset)
      .fetch_optional(&self.pool)
      .await?,
    )
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

  pub async fn delete_article(
    &self,
    user_id: Uuid,
    article_id: Uuid,
  ) -> Result<bool> {
    Ok(
      sqlx::query(
        "DELETE FROM articles WHERE user_id = $1 AND article_id = $2",
      )
      .bind(user_id)
      .bind(article_id)
      .execute(&self.pool)
      .await?
      .rows_affected()
        > 0,
    )
  }

  pub async fn delete_highlight(
    &self,
    user_id: Uuid,
    article_id: Uuid,
    highlight_id: Uuid,
  ) -> Result<bool> {
    Ok(
      sqlx::query(
        r#"
      DELETE FROM highlights
      WHERE user_id = $1 AND article_id = $2 AND highlight_id = $3
      "#,
      )
      .bind(user_id)
      .bind(article_id)
      .bind(highlight_id)
      .execute(&self.pool)
      .await?
      .rows_affected()
        > 0,
    )
  }

  pub async fn highlights(
    &self,
    user_id: Uuid,
    article_id: Uuid,
  ) -> Result<Vec<Highlight>> {
    Ok(
      sqlx::query_as::<_, Highlight>(
        r#"
      SELECT
        highlight_id,
        article_id,
        selected_text,
        context_before,
        context_after,
        start_offset,
        end_offset,
        color,
        note,
        created_at,
        updated_at
      FROM highlights
      WHERE user_id = $1 AND article_id = $2
      ORDER BY start_offset, end_offset, created_at
      "#,
      )
      .bind(user_id)
      .bind(article_id)
      .fetch_all(&self.pool)
      .await?,
    )
  }

  pub async fn save_progress(
    &self,
    user_id: Uuid,
    article_id: Uuid,
    progress: &ReadingProgress,
  ) -> Result<Option<ReadingProgress>> {
    Ok(
      sqlx::query_as::<_, ReadingProgress>(
        r#"
      INSERT INTO reading_progress (
        article_id,
        user_id,
        scroll_position,
        time_spent_seconds
      )
      SELECT article_id, user_id, $3, $4
      FROM articles
      WHERE user_id = $1 AND article_id = $2
      ON CONFLICT (article_id, user_id) DO UPDATE
      SET scroll_position = EXCLUDED.scroll_position,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        last_read_at = NOW()
      RETURNING
        scroll_position::FLOAT8 AS scroll_position,
        time_spent_seconds
      "#,
      )
      .bind(user_id)
      .bind(article_id)
      .bind(progress.scroll_position)
      .bind(progress.time_spent_seconds)
      .fetch_optional(&self.pool)
      .await?,
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
      WITH saved AS (
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
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM highlights
            JOIN articles USING (article_id)
            WHERE articles.user_id = $1 AND articles.normalized_url = $3
          ) THEN NULL
          ELSE $12
        END,
        $13, $14, $15
      )
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
      RETURNING (xmax = 0) AS created, *
      )
      SELECT
        created,
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
        date_read,
        COALESCE(scroll_position, 0)::FLOAT8 AS scroll_position,
        COALESCE(time_spent_seconds, 0) AS time_spent_seconds
      FROM saved
      LEFT JOIN reading_progress USING (article_id, user_id)
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

  pub async fn update_article(
    &self,
    user_id: Uuid,
    article_id: Uuid,
    is_archived: Option<bool>,
    is_favorited: Option<bool>,
    is_read: Option<bool>,
  ) -> Result<Option<Article>> {
    Ok(
      sqlx::query_as::<_, Article>(
        r#"
      WITH updated AS (
      UPDATE articles
      SET is_archived = COALESCE($3, is_archived),
        is_favorited = COALESCE($4, is_favorited),
        date_read = CASE
          WHEN $5 IS NULL THEN date_read
          WHEN $5 THEN COALESCE(date_read, NOW())
        END
      WHERE user_id = $1 AND article_id = $2
      RETURNING *
      )
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
        date_read,
        COALESCE(scroll_position, 0)::FLOAT8 AS scroll_position,
        COALESCE(time_spent_seconds, 0) AS time_spent_seconds
      FROM updated
      LEFT JOIN reading_progress USING (article_id, user_id)
      "#,
      )
      .bind(user_id)
      .bind(article_id)
      .bind(is_archived)
      .bind(is_favorited)
      .bind(is_read)
      .fetch_optional(&self.pool)
      .await?,
    )
  }

  pub async fn update_highlight(
    &self,
    user_id: Uuid,
    article_id: Uuid,
    highlight_id: Uuid,
    color: Option<&str>,
    note: Option<&str>,
  ) -> Result<Option<Highlight>> {
    Ok(
      sqlx::query_as::<_, Highlight>(
        r#"
      UPDATE highlights
      SET color = COALESCE($4, color),
        note = CASE WHEN $5::TEXT IS NULL THEN note ELSE NULLIF($5, '') END
      WHERE user_id = $1 AND article_id = $2 AND highlight_id = $3
      RETURNING
        highlight_id,
        article_id,
        selected_text,
        context_before,
        context_after,
        start_offset,
        end_offset,
        color,
        note,
        created_at,
        updated_at
      "#,
      )
      .bind(user_id)
      .bind(article_id)
      .bind(highlight_id)
      .bind(color)
      .bind(note)
      .fetch_optional(&self.pool)
      .await?,
    )
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
  async fn article() {
    let TestContext { db, .. } = TestContext::new().await;

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let other = db.upsert_user("bar@baz.com", None).await.unwrap();

    let (article, _) = db
      .save_article(&new_article(user.user_id, Some(content())))
      .await
      .unwrap();

    assert_eq!(
      db.article(user.user_id, article.article_id).await.unwrap(),
      Some(ArticleWithContent {
        article: article.clone(),
        content: Some("<p>baz</p>".into()),
      }),
    );

    assert_eq!(
      db.article(other.user_id, article.article_id).await.unwrap(),
      None,
    );

    let updated = db
      .update_article(user.user_id, article.article_id, Some(true), None, None)
      .await
      .unwrap();

    assert_eq!(
      updated,
      Some(Article {
        is_archived: true,
        ..article.clone()
      }),
    );

    assert_eq!(
      db.update_article(
        other.user_id,
        article.article_id,
        Some(false),
        None,
        None
      )
      .await
      .unwrap(),
      None,
    );

    assert!(
      !db
        .delete_article(other.user_id, article.article_id)
        .await
        .unwrap()
    );

    assert!(
      db.delete_article(user.user_id, article.article_id)
        .await
        .unwrap()
    );

    assert_eq!(
      db.article(user.user_id, article.article_id).await.unwrap(),
      None,
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn highlights() {
    let TestContext { db, .. } = TestContext::new().await;

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let other = db.upsert_user("bar@baz.com", None).await.unwrap();

    let (article, _) = db
      .save_article(&new_article(user.user_id, Some(content())))
      .await
      .unwrap();

    assert_eq!(
      db.article_text(user.user_id, article.article_id)
        .await
        .unwrap(),
      Some("baz".into()),
    );

    assert_eq!(
      db.article_text(other.user_id, article.article_id)
        .await
        .unwrap(),
      None,
    );

    let new_highlight = |user_id| NewHighlight {
      article_id: article.article_id,
      context_after: "bar",
      context_before: "foo",
      end_offset: 3,
      selected_text: "baz",
      start_offset: 0,
      user_id,
    };

    assert_eq!(
      db.create_highlight(&new_highlight(other.user_id))
        .await
        .unwrap(),
      None,
    );

    let highlight = db
      .create_highlight(&new_highlight(user.user_id))
      .await
      .unwrap()
      .unwrap();

    assert_eq!(
      highlight,
      Highlight {
        highlight_id: highlight.highlight_id,
        article_id: article.article_id,
        selected_text: "baz".into(),
        context_before: Some("foo".into()),
        context_after: Some("bar".into()),
        start_offset: 0,
        end_offset: 3,
        color: "#FFEB3B".into(),
        note: None,
        created_at: highlight.created_at,
        updated_at: highlight.updated_at,
      },
    );

    assert_eq!(
      sqlx::query(
        r#"
        INSERT INTO highlights (
          article_id,
          user_id,
          selected_text,
          start_offset,
          end_offset
        )
        VALUES ($1, $2, 'baz', 0, 3)
        "#,
      )
      .bind(article.article_id)
      .bind(other.user_id)
      .execute(&db.pool)
      .await
      .unwrap_err()
      .to_string(),
      "error returned from database: insert or update on table \"highlights\" violates foreign key constraint \"highlights_article_id_user_id_fkey\"",
    );

    assert_eq!(
      db.highlights(user.user_id, article.article_id)
        .await
        .unwrap(),
      vec![highlight.clone()],
    );

    assert_eq!(
      db.highlights(other.user_id, article.article_id)
        .await
        .unwrap(),
      Vec::new(),
    );

    let update = async |user_id, color, note| {
      db.update_highlight(
        user_id,
        article.article_id,
        highlight.highlight_id,
        color,
        note,
      )
      .await
      .unwrap()
      .map(|updated| Highlight {
        updated_at: highlight.updated_at,
        ..updated
      })
    };

    assert_eq!(
      update(user.user_id, Some("#000000"), Some("bar")).await,
      Some(Highlight {
        color: "#000000".into(),
        note: Some("bar".into()),
        ..highlight.clone()
      }),
    );

    assert_eq!(
      update(user.user_id, None, None).await,
      Some(Highlight {
        color: "#000000".into(),
        note: Some("bar".into()),
        ..highlight.clone()
      }),
    );

    assert_eq!(
      update(user.user_id, None, Some("")).await,
      Some(Highlight {
        color: "#000000".into(),
        ..highlight.clone()
      }),
    );

    assert_eq!(update(other.user_id, None, Some("baz")).await, None);

    assert!(
      !db
        .delete_highlight(
          other.user_id,
          article.article_id,
          highlight.highlight_id
        )
        .await
        .unwrap()
    );

    assert!(
      db.delete_highlight(
        user.user_id,
        article.article_id,
        highlight.highlight_id
      )
      .await
      .unwrap()
    );

    assert_eq!(
      db.highlights(user.user_id, article.article_id)
        .await
        .unwrap(),
      Vec::new(),
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn resaving_highlighted_article_keeps_content() {
    let TestContext { db, .. } = TestContext::new().await;

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let save = async |text: &str| {
      db.save_article(&new_article(
        user.user_id,
        Some(ArticleContent {
          content: format!("<p>{text}</p>"),
          text_content: text.into(),
          ..content()
        }),
      ))
      .await
      .unwrap()
      .0
    };

    let content = async |article: &Article| {
      (
        db.article(user.user_id, article.article_id)
          .await
          .unwrap()
          .unwrap()
          .content,
        db.article_text(user.user_id, article.article_id)
          .await
          .unwrap(),
      )
    };

    save("foo").await;

    let article = save("bar").await;

    assert_eq!(
      content(&article).await,
      (Some("<p>bar</p>".into()), Some("bar".into())),
    );

    db.create_highlight(&NewHighlight {
      article_id: article.article_id,
      context_after: "",
      context_before: "",
      end_offset: 3,
      selected_text: "bar",
      start_offset: 0,
      user_id: user.user_id,
    })
    .await
    .unwrap()
    .unwrap();

    save("baz").await;

    assert_eq!(
      content(&article).await,
      (Some("<p>bar</p>".into()), Some("bar".into())),
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn read() {
    let TestContext { db, .. } = TestContext::new().await;

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let (article, _) = db
      .save_article(&new_article(user.user_id, None))
      .await
      .unwrap();

    let read = db
      .update_article(user.user_id, article.article_id, None, None, Some(true))
      .await
      .unwrap()
      .unwrap();

    assert!(read.date_read.is_some());

    assert_eq!(
      read,
      Article {
        date_read: read.date_read,
        ..article.clone()
      },
    );

    assert_eq!(
      db.update_article(
        user.user_id,
        article.article_id,
        None,
        None,
        Some(true)
      )
      .await
      .unwrap(),
      Some(read),
    );

    assert_eq!(
      db.update_article(
        user.user_id,
        article.article_id,
        None,
        None,
        Some(false)
      )
      .await
      .unwrap(),
      Some(article),
    );
  }

  #[tokio::test(flavor = "multi_thread")]
  async fn save_progress() {
    let TestContext { db, .. } = TestContext::new().await;

    let user = db.upsert_user("foo@bar.com", None).await.unwrap();

    let other = db.upsert_user("bar@baz.com", None).await.unwrap();

    let (article, _) = db
      .save_article(&new_article(user.user_id, None))
      .await
      .unwrap();

    assert_eq!(
      article.progress,
      ReadingProgress {
        scroll_position: 0.0,
        time_spent_seconds: 0,
      },
    );

    let progress = ReadingProgress {
      scroll_position: 0.25,
      time_spent_seconds: 10,
    };

    assert_eq!(
      db.save_progress(other.user_id, article.article_id, &progress)
        .await
        .unwrap(),
      None,
    );

    assert_eq!(
      db.save_progress(user.user_id, article.article_id, &progress)
        .await
        .unwrap(),
      Some(progress.clone()),
    );

    let progress = ReadingProgress {
      scroll_position: 0.5,
      time_spent_seconds: 20,
    };

    assert_eq!(
      db.save_progress(user.user_id, article.article_id, &progress)
        .await
        .unwrap(),
      Some(progress.clone()),
    );

    let article = Article {
      progress,
      ..article
    };

    assert_eq!(
      db.article(user.user_id, article.article_id).await.unwrap(),
      Some(ArticleWithContent {
        article: article.clone(),
        content: None,
      }),
    );

    assert_eq!(
      db.articles(user.user_id, None, 50).await.unwrap(),
      vec![article]
    );
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

    assert_eq!(
      db.articles(user.user_id, None, 50).await.unwrap(),
      vec![resaved]
    );
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
