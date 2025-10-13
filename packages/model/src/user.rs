use {
  chrono::{DateTime, Utc},
  serde::{Deserialize, Serialize},
  sqlx::FromRow,
  utoipa::ToSchema,
  uuid::Uuid,
};

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, FromRow)]
pub struct User {
  /// Unique identifier for the user.
  pub user_id: Uuid,
  /// Primary user email used for authentication.
  pub email: String,
  /// Display name supplied by the user, if available.
  pub name: Option<String>,
  /// Timestamp for when the user record was created.
  pub created_at: DateTime<Utc>,
  /// Timestamp for when the user record was most recently updated.
  pub updated_at: DateTime<Utc>,
}
