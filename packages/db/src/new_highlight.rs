use super::*;

#[derive(Debug, Clone)]
pub struct NewHighlight<'a> {
  pub article_id: Uuid,
  pub context_after: &'a str,
  pub context_before: &'a str,
  pub end_offset: i32,
  pub selected_text: &'a str,
  pub start_offset: i32,
  pub user_id: Uuid,
}
