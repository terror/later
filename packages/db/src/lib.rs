use {
  chrono::{DateTime, Utc},
  model::{
    Article, ArticleStatus, ArticleWithContent, Highlight, ReadingProgress,
    User,
  },
  sqlx::{FromRow, PgPool},
  std::time::Duration,
  uuid::Uuid,
};

mod article_content;
mod claimed_article;
mod db;
mod error;
mod new_article;
mod new_highlight;

pub type Result<T = (), E = Error> = std::result::Result<T, E>;

pub use {
  article_content::ArticleContent, claimed_article::ClaimedArticle, db::Db,
  error::Error, new_article::NewArticle, new_highlight::NewHighlight,
};
