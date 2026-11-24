use super::*;

#[derive(Debug, Deserialize, ToSchema)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct UpdateHighlight {
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub color: Option<String>,
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub note: Option<String>,
}
