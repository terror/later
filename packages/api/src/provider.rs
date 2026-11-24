use super::*;

#[derive(Debug, Deserialize)]
struct GoogleUser {
  email: String,
  email_verified: bool,
  name: Option<String>,
}

impl TryFrom<GoogleUser> for Identity {
  type Error = Error;

  fn try_from(user: GoogleUser) -> Result<Self> {
    if !user.email_verified {
      return Err(anyhow!("Google account email is not verified").into());
    }

    Ok(Self {
      email: user.email,
      name: user.name,
    })
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub(crate) enum Provider {
  Github,
  Google,
}

impl Provider {
  pub(crate) const ALL: [Self; 2] = [Self::Github, Self::Google];

  fn auth_url(self) -> &'static str {
    match self {
      Self::Github => "https://github.com/login/oauth/authorize",
      Self::Google => "https://accounts.google.com/o/oauth2/v2/auth",
    }
  }

  pub(crate) fn client(
    self,
    var: impl Fn(&str) -> Option<String>,
  ) -> Result<Option<ConfiguredOAuthClient>> {
    let var = |suffix: &str| {
      let name = format!("{}_{suffix}", self.prefix());
      (var(&name).filter(|value| !value.is_empty()), name)
    };

    let (Some(client_id), _) = var("CLIENT_ID") else {
      return Ok(None);
    };

    let required = |suffix: &str| match var(suffix) {
      (Some(value), _) => Ok(value),
      (None, name) => Err(anyhow!("{name} must be set")),
    };

    let client_secret = required("CLIENT_SECRET")?;

    let redirect_url = required("REDIRECT_URL")?;

    let auth_url = AuthUrl::new(self.auth_url().to_string())
      .context("failed to create new authorization server URL")?;

    let token_url = TokenUrl::new(self.token_url().to_string())
      .context("failed to create new token endpoint URL")?;

    Ok(Some(
      OAuth2BasicClient::new(ClientId::new(client_id))
        .set_client_secret(ClientSecret::new(client_secret))
        .set_auth_uri(auth_url)
        .set_token_uri(token_url)
        .set_redirect_uri(
          RedirectUrl::new(redirect_url)
            .context("failed to create new redirection URL")?,
        ),
    ))
  }

  async fn github_identity(access_token: &str) -> Result<Identity> {
    let client = reqwest::Client::new();

    let user = client
      .get("https://api.github.com/user")
      .bearer_auth(access_token)
      .header("User-Agent", "Later-App")
      .send()
      .await
      .context("failed in sending request to GitHub API")?
      .json::<Value>()
      .await
      .context("failed to deserialize response as JSON")?;

    let name = user.get("name").and_then(Value::as_str);

    let emails = client
      .get("https://api.github.com/user/emails")
      .bearer_auth(access_token)
      .header("User-Agent", "Later-App")
      .send()
      .await
      .context("failed to fetch user emails from GitHub API")?
      .json::<Value>()
      .await
      .context("failed to deserialize emails response as JSON")?;

    let is_verified = |email: &&Value| {
      email
        .get("verified")
        .and_then(Value::as_bool)
        .unwrap_or(false)
    };

    let is_primary = |email: &&Value| {
      email
        .get("primary")
        .and_then(Value::as_bool)
        .unwrap_or(false)
    };

    let email = emails
      .as_array()
      .and_then(|emails| {
        emails
          .iter()
          .find(|e| is_primary(e) && is_verified(e))
          .or_else(|| emails.iter().find(is_verified))
          .and_then(|e| e.get("email")?.as_str())
      })
      .ok_or_else(|| anyhow!("no verified email found for GitHub user"))?;

    Ok(Identity {
      email: email.to_string(),
      name: name.map(str::to_string),
    })
  }

  async fn google_identity(access_token: &str) -> Result<Identity> {
    reqwest::Client::new()
      .get("https://openidconnect.googleapis.com/v1/userinfo")
      .bearer_auth(access_token)
      .send()
      .await
      .context("failed in sending request to Google API")?
      .error_for_status()
      .context("failed to fetch user info from Google API")?
      .json::<GoogleUser>()
      .await
      .context("failed to deserialize user info response as JSON")?
      .try_into()
  }

  pub(crate) async fn identity(self, access_token: &str) -> Result<Identity> {
    match self {
      Self::Github => Self::github_identity(access_token).await,
      Self::Google => Self::google_identity(access_token).await,
    }
  }

  fn prefix(self) -> &'static str {
    match self {
      Self::Github => "GITHUB",
      Self::Google => "GOOGLE",
    }
  }

  pub(crate) fn scopes(self) -> &'static [&'static str] {
    match self {
      Self::Github => &["user:email"],
      Self::Google => &["openid", "email", "profile"],
    }
  }

  fn token_url(self) -> &'static str {
    match self {
      Self::Github => "https://github.com/login/oauth/access_token",
      Self::Google => "https://oauth2.googleapis.com/token",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn google_user() {
    #[track_caller]
    fn case(json: &str, expected: Result<Identity, &str>) {
      assert_eq!(
        Identity::try_from(serde_json::from_str::<GoogleUser>(json).unwrap())
          .map_err(|error| error.to_string()),
        expected.map_err(str::to_string),
      );
    }

    case(
      r#"{"email":"foo@bar.com","email_verified":true,"name":"baz"}"#,
      Ok(Identity {
        email: "foo@bar.com".into(),
        name: Some("baz".into()),
      }),
    );
    case(
      r#"{"email":"foo@bar.com","email_verified":true}"#,
      Ok(Identity {
        email: "foo@bar.com".into(),
        name: None,
      }),
    );
    case(
      r#"{"email":"foo@bar.com","email_verified":false,"name":"baz"}"#,
      Err("Google account email is not verified"),
    );
  }
}
