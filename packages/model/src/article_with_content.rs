use super::*;

#[derive(
  Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, FromRow,
)]
pub struct ArticleWithContent {
  #[serde(flatten)]
  #[sqlx(flatten)]
  pub article: Article,
  pub content: Option<String>,
}
