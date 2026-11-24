use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "sqlx", derive(FromRow))]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct ReadingProgress {
  pub scroll_position: f64,
  pub time_spent_seconds: i32,
}
