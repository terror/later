use super::*;

#[derive(Debug, Deserialize, ToSchema)]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct CreateHighlight {
  pub end_offset: i32,
  pub selected_text: String,
  pub start_offset: i32,
}
