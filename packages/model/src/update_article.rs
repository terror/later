use super::*;

#[derive(Debug, Deserialize, ToSchema)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct UpdateArticle {
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub is_archived: Option<bool>,
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub is_favorited: Option<bool>,
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub is_read: Option<bool>,
}
