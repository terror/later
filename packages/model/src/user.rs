use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "sqlx", derive(FromRow))]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct User {
  /// Unique identifier for the user.
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub user_id: Uuid,
  /// Primary user email used for authentication.
  pub email: String,
  /// Display name supplied by the user, if available.
  pub name: Option<String>,
  /// Timestamp for when the user record was created.
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub created_at: DateTime<Utc>,
  /// Timestamp for when the user record was most recently updated.
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  pub updated_at: DateTime<Utc>,
}
