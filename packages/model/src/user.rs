use {
  chrono::{DateTime, Utc},
  serde::{Deserialize, Serialize},
  utoipa::ToSchema,
  uuid::Uuid,
};

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct User {
  /// Unique identifier for the user.
  pub user_id: Uuid,
  /// Numeric GitHub identifier associated with the user.
  pub github_id: i64,
  /// Primary user email if one has been provided.
  pub email: Option<String>,
  /// GitHub username for login and display.
  pub username: String,
  /// Display name supplied by the user, if available.
  pub name: Option<String>,
  /// URL pointing to the user's avatar image.
  pub avatar_url: Option<String>,
  /// Timestamp for when the user record was created.
  pub created_at: DateTime<Utc>,
  /// Timestamp for when the user record was most recently updated.
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct NewUser {
  /// Numeric GitHub identifier associated with the user.
  pub github_id: i64,
  /// Primary user email if one has been provided.
  pub email: Option<String>,
  /// GitHub username for login and display.
  pub username: String,
  /// Display name supplied by the user, if available.
  pub name: Option<String>,
  /// URL pointing to the user's avatar image.
  pub avatar_url: Option<String>,
}
