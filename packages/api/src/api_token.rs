use super::*;

const PREFIX: &str = "later_";

pub(crate) struct ApiToken(String);

impl ApiToken {
  pub(crate) fn generate() -> Self {
    Self(format!(
      "{PREFIX}{}",
      rand::random::<[u8; 32]>()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>()
    ))
  }

  pub(crate) fn hash(token: &str) -> Vec<u8> {
    Sha256::digest(token.as_bytes()).to_vec()
  }

  pub(crate) fn into_inner(self) -> String {
    self.0
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn generate() {
    let token = ApiToken::generate().into_inner();

    assert_eq!(token.len(), 70);

    assert!(
      token
        .strip_prefix("later_")
        .unwrap()
        .chars()
        .all(|c| matches!(c, '0'..='9' | 'a'..='f'))
    );

    assert_ne!(token, ApiToken::generate().into_inner());
  }

  #[test]
  fn hash() {
    assert_eq!(
      ApiToken::hash("foo")
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>(),
      "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    );
  }
}
