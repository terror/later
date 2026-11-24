use super::*;

#[derive(Clone, Debug)]
pub(crate) struct OAuthClients {
  github: ConfiguredOAuthClient,
  google: Option<ConfiguredOAuthClient>,
}

impl OAuthClients {
  pub(crate) fn get(
    &self,
    provider: Provider,
  ) -> Result<&ConfiguredOAuthClient> {
    match provider {
      Provider::Github => Ok(&self.github),
      Provider::Google => Ok(self.google.as_ref().ok_or(NotFound)?),
    }
  }

  pub(crate) fn new(var: impl Fn(&str) -> Option<String>) -> Result<Self> {
    Ok(Self {
      github: Provider::Github
        .client(&var)?
        .context("GITHUB_CLIENT_ID must be set")?,
      google: Provider::Google.client(&var)?,
    })
  }

  pub(crate) fn providers(&self) -> Vec<Provider> {
    Provider::ALL
      .into_iter()
      .filter(|provider| self.get(*provider).is_ok())
      .collect()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn clients(vars: &[(&str, &str)]) -> Result<OAuthClients> {
    OAuthClients::new(|name| {
      vars
        .iter()
        .find(|(key, _)| *key == name)
        .map(|(_, value)| value.to_string())
    })
  }

  const GITHUB: [(&str, &str); 3] = [
    ("GITHUB_CLIENT_ID", "foo"),
    ("GITHUB_CLIENT_SECRET", "bar"),
    ("GITHUB_REDIRECT_URL", "https://foo.com/auth/authorized"),
  ];

  #[test]
  fn providers() {
    #[track_caller]
    fn case(vars: &[(&str, &str)], expected: &[Provider]) {
      assert_eq!(clients(vars).unwrap().providers(), expected);
    }

    case(&GITHUB, &[Provider::Github]);
    case(
      &[GITHUB.as_slice(), &[("GOOGLE_CLIENT_ID", "")]].concat(),
      &[Provider::Github],
    );
    case(
      &[
        GITHUB.as_slice(),
        &[
          ("GOOGLE_CLIENT_ID", "baz"),
          ("GOOGLE_CLIENT_SECRET", "qux"),
          (
            "GOOGLE_REDIRECT_URL",
            "https://foo.com/auth/google/authorized",
          ),
        ],
      ]
      .concat(),
      &[Provider::Github, Provider::Google],
    );
  }

  #[test]
  fn errors() {
    #[track_caller]
    fn case(vars: &[(&str, &str)], expected: &str) {
      assert_eq!(clients(vars).unwrap_err().to_string(), expected);
    }

    case(&[], "GITHUB_CLIENT_ID must be set");
    case(&GITHUB[..2], "GITHUB_REDIRECT_URL must be set");
    case(
      &[GITHUB.as_slice(), &[("GOOGLE_CLIENT_ID", "baz")]].concat(),
      "GOOGLE_CLIENT_SECRET must be set",
    );
  }

  #[test]
  fn get() {
    assert_eq!(
      clients(&GITHUB)
        .unwrap()
        .get(Provider::Google)
        .unwrap_err()
        .to_string(),
      "not found",
    );
  }
}
