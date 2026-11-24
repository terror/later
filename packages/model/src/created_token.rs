use super::*;

#[derive(Debug, Serialize, ToSchema)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct CreatedToken {
  pub token: String,
}
