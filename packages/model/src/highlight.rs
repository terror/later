use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "sqlx", derive(FromRow))]
#[cfg_attr(feature = "tsify", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct Highlight {
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub highlight_id: Uuid,
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub article_id: Uuid,
  pub selected_text: String,
  pub context_before: Option<String>,
  pub context_after: Option<String>,
  pub start_offset: i32,
  pub end_offset: i32,
  pub color: String,
  pub note: Option<String>,
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub created_at: DateTime<Utc>,
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub updated_at: DateTime<Utc>,
}
