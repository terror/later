use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "sqlx", derive(FromRow))]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct Article {
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub article_id: Uuid,
  pub url: String,
  pub title: Option<String>,
  pub author: Option<String>,
  pub excerpt: Option<String>,
  pub site_name: Option<String>,
  pub lang: Option<String>,
  pub dir: Option<String>,
  #[cfg_attr(feature = "tsify", tsify(type = "string | null"))]
  pub publication_date: Option<DateTime<Utc>>,
  pub word_count: Option<i32>,
  pub reading_time_minutes: Option<i32>,
  pub is_archived: bool,
  pub is_favorited: bool,
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub date_saved: DateTime<Utc>,
  #[cfg_attr(feature = "tsify", tsify(type = "string | null"))]
  pub date_read: Option<DateTime<Utc>>,
  #[cfg_attr(feature = "sqlx", sqlx(flatten))]
  pub progress: ReadingProgress,
}
