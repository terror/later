use super::*;

#[derive(Debug, Deserialize, IntoParams)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
#[into_params(parameter_in = Query)]
#[serde(rename_all = "camelCase")]
pub struct ListArticles {
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub cursor: Option<String>,
  #[cfg_attr(feature = "tsify", tsify(optional))]
  pub limit: Option<usize>,
}
