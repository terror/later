use super::*;

#[derive(Debug, Clone, PartialEq, FromRow)]
pub struct ClaimedArticle {
  pub article_id: Uuid,
  pub url: String,
  pub attempts: i32,
}
