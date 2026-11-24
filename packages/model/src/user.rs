use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "sqlx", derive(FromRow))]
#[cfg_attr(feature = "tsify", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct User {
  /// Unique identifier for the user.
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  #[serde(alias = "user_id")]
  pub user_id: Uuid,
  /// Primary user email used for authentication.
  pub email: String,
  /// Display name supplied by the user, if available.
  pub name: Option<String>,
  /// Timestamp for when the user record was created.
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  #[serde(alias = "created_at")]
  pub created_at: DateTime<Utc>,
  /// Timestamp for when the user record was most recently updated.
  #[cfg_attr(feature = "tsify", tsify(type = "string"))]
  #[serde(alias = "updated_at")]
  pub updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
  use {super::*, serde_json::json};

  #[test]
  fn deserialize() {
    #[track_caller]
    fn case(value: serde_json::Value) {
      assert_eq!(
        serde_json::from_value::<User>(value).unwrap(),
        User {
          user_id: Uuid::nil(),
          email: "foo".into(),
          name: Some("bar".into()),
          created_at: DateTime::UNIX_EPOCH,
          updated_at: DateTime::UNIX_EPOCH,
        },
      );
    }

    case(json!({
      "userId": "00000000-0000-0000-0000-000000000000",
      "email": "foo",
      "name": "bar",
      "createdAt": "1970-01-01T00:00:00Z",
      "updatedAt": "1970-01-01T00:00:00Z",
    }));

    case(json!({
      "user_id": "00000000-0000-0000-0000-000000000000",
      "email": "foo",
      "name": "bar",
      "created_at": "1970-01-01T00:00:00Z",
      "updated_at": "1970-01-01T00:00:00Z",
    }));
  }
}
