#[derive(Debug, Clone)]
pub struct Product {
  /// Extracted `<title>` value.
  pub title: String,
  /// HTML snippet containing the best candidate node.
  pub content: String,
  /// Plain-text representation of the candidate node.
  pub text: String,
}
