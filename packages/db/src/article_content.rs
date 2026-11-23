use super::*;

#[derive(Debug, Clone, PartialEq)]
pub struct ArticleContent {
  pub author: Option<String>,
  pub content: String,
  pub dir: Option<String>,
  pub excerpt: Option<String>,
  pub lang: Option<String>,
  pub publication_date: Option<DateTime<Utc>>,
  pub reading_time_minutes: i32,
  pub site_name: Option<String>,
  pub text_content: String,
  pub title: Option<String>,
  pub word_count: i32,
}
