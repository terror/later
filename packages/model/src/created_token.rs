use super::*;

#[derive(Debug, Serialize, ToSchema)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct CreatedToken {
  pub token: String,
}
