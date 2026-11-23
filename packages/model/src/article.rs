use super::*;

#[derive(
  Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, FromRow,
)]
pub struct Article {
  pub article_id: Uuid,
  pub url: String,
  pub title: Option<String>,
  pub author: Option<String>,
  pub excerpt: Option<String>,
  pub site_name: Option<String>,
  pub lang: Option<String>,
  pub dir: Option<String>,
  pub publication_date: Option<DateTime<Utc>>,
  pub word_count: Option<i32>,
  pub reading_time_minutes: Option<i32>,
  pub is_archived: bool,
  pub is_favorited: bool,
  pub date_saved: DateTime<Utc>,
  pub date_read: Option<DateTime<Utc>>,
}
