use {
  chrono::{DateTime, Utc},
  model::{Article, ArticleWithContent, User},
  sqlx::{FromRow, PgPool},
  uuid::Uuid,
};

mod article_content;
mod db;
mod error;
mod new_article;

pub type Result<T = (), E = Error> = std::result::Result<T, E>;

pub use {
  article_content::ArticleContent, db::Db, error::Error,
  new_article::NewArticle,
};
