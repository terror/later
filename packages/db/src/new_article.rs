use super::*;

#[derive(Debug, Clone)]
pub struct NewArticle<'a> {
  pub content: Option<ArticleContent>,
  pub html: Option<&'a str>,
  pub normalized_url: &'a str,
  pub url: &'a str,
  pub user_id: Uuid,
}
