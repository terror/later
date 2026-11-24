use super::*;

#[derive(
  Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema, FromRow,
)]
pub struct ReadingProgress {
  pub scroll_position: f64,
  pub time_spent_seconds: i32,
}
