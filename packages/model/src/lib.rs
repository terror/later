#[cfg(feature = "sqlx")]
use sqlx::FromRow;
#[cfg(feature = "tsify")]
use tsify::Tsify;
use {
  chrono::{DateTime, Utc},
  serde::{Deserialize, Serialize},
  utoipa::ToSchema,
  uuid::Uuid,
};

mod article;
mod article_with_content;
mod create_highlight;
mod created_token;
mod highlight;
mod reading_progress;
mod save_article;
mod update_article;
mod update_highlight;
mod user;

pub use {
  article::Article, article_with_content::ArticleWithContent,
  create_highlight::CreateHighlight, created_token::CreatedToken,
  highlight::Highlight, reading_progress::ReadingProgress,
  save_article::SaveArticle, update_article::UpdateArticle,
  update_highlight::UpdateHighlight, user::User,
};
