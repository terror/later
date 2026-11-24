use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct ArticlePage {
  pub articles: Vec<Article>,
  pub next_cursor: Option<String>,
}
