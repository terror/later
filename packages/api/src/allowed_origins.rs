use super::*;

#[derive(Clone, Debug)]
enum Pattern {
  Exact(String),
  Wildcard { prefix: String, suffix: String },
}

impl Pattern {
  fn matches(&self, origin: &str) -> bool {
    match self {
      Self::Exact(expected) => origin == expected,
      Self::Wildcard { prefix, suffix } => origin
        .strip_prefix(prefix.as_str())
        .and_then(|rest| rest.strip_suffix(suffix.as_str()))
        .is_some_and(|middle| {
          !middle.is_empty()
            && middle
              .chars()
              .all(|c| c.is_ascii_alphanumeric() || c == '-')
        }),
    }
  }
}

#[derive(Clone, Debug)]
pub(crate) struct AllowedOrigins(Vec<Pattern>);

impl AllowedOrigins {
  pub(crate) fn new(patterns: &str) -> Self {
    Self(
      patterns
        .split(',')
        .map(str::trim)
        .filter(|pattern| !pattern.is_empty())
        .map(|pattern| match pattern.split_once('*') {
          Some((prefix, suffix)) => Pattern::Wildcard {
            prefix: prefix.into(),
            suffix: suffix.into(),
          },
          None => Pattern::Exact(pattern.into()),
        })
        .collect(),
    )
  }

  pub(crate) fn validate(&self, redirect: &str) -> Result<Url> {
    let url = Url::parse(redirect).context("invalid redirect URL")?;

    let origin = url.origin().ascii_serialization();

    if !self.0.iter().any(|pattern| pattern.matches(&origin)) {
      return Err(anyhow!("redirect origin `{origin}` is not allowed").into());
    }

    Ok(url)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn validate() {
    #[track_caller]
    fn case(patterns: &str, redirect: &str, expected: Option<&str>) {
      assert_eq!(
        AllowedOrigins::new(patterns)
          .validate(redirect)
          .ok()
          .map(|url| url.to_string()),
        expected.map(str::to_string),
      );
    }

    case(
      "https://foo.com",
      "https://foo.com/bar",
      Some("https://foo.com/bar"),
    );
    case("https://foo.com", "https://bar.com/", None);
    case("https://foo.com", "http://foo.com/", None);
    case("https://foo.com", "/bar", None);
    case(
      "https://foo.com, https://bar.com",
      "https://bar.com/baz",
      Some("https://bar.com/baz"),
    );
    case(
      "https://foo-*-bar.com",
      "https://foo-baz-bar.com/",
      Some("https://foo-baz-bar.com/"),
    );
    case("https://foo-*-bar.com", "https://foo--bar.com/", None);
    case(
      "https://foo-*-bar.com",
      "https://foo-baz.qux-bar.com/",
      None,
    );
    case(
      "https://foo-*-bar.com",
      "https://foo-baz-bar.com.qux.com/",
      None,
    );
  }

  #[test]
  fn validate_error() {
    #[track_caller]
    fn case(redirect: &str, expected: &str) {
      assert_eq!(
        AllowedOrigins::new("https://foo.com")
          .validate(redirect)
          .unwrap_err()
          .to_string(),
        expected,
      );
    }

    case(
      "https://bar.com/",
      "redirect origin `https://bar.com` is not allowed",
    );
    case("/bar", "invalid redirect URL");
  }
}
