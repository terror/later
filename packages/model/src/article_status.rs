use super::*;

#[derive(
  Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema,
)]
#[cfg_attr(feature = "sqlx", derive(Type))]
#[cfg_attr(feature = "tsify", derive(Tsify))]
#[serde(rename_all = "lowercase")]
#[cfg_attr(
  feature = "sqlx",
  sqlx(type_name = "article_status", rename_all = "lowercase")
)]
pub enum ArticleStatus {
  Pending,
  Extracted,
  Failed,
}
