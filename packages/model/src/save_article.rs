use super::*;

#[derive(Debug, Deserialize, ToSchema)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct SaveArticle {
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub html: Option<String>,
  pub url: String,
}
