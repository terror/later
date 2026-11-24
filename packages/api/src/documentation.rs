use super::*;

struct GithubOAuthSecurity;

impl Modify for GithubOAuthSecurity {
  fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
    let components = openapi.components.get_or_insert_with(Components::default);

    if components.security_schemes.contains_key("githubOAuth") {
      return;
    }

    components.add_security_scheme(
      "githubOAuth",
      SecurityScheme::OAuth2(OAuth2::new([Flow::AuthorizationCode(
        AuthorizationCode::new(
          "https://github.com/login/oauth/authorize",
          "https://github.com/login/oauth/access_token",
          Scopes::from_iter([("user:email", "Authenticate with GitHub.")]),
        ),
      )])),
    );
  }
}

#[derive(OpenApi)]
#[openapi(
  info(
    title = "later",
    description = "A self-hostable read-it-later service."
  ),
  servers(
    (url = "https://api.later.sh")
  ),
  modifiers(&GithubOAuthSecurity),
  paths(
    articles::delete,
    articles::get,
    articles::list,
    articles::save,
    articles::update,
    auth::login,
    auth::login_authorized,
    auth::exchange,
    auth::google_authorized,
    auth::google_login,
    auth::logout,
    auth::providers,
    auth::session,
    tokens::create,
    tokens::delete,
  ),
  components(
    schemas(
      articles::SaveArticle,
      articles::UpdateArticle,
      model::Article,
      model::ArticleWithContent,
      model::User,
      provider::Provider,
      tokens::CreatedToken
    )
  ),
  tags(
    (name = "articles"),
    (name = "auth", description = "All authentication related endpoints."),
    (name = "tokens"),
  ),
)]
pub(crate) struct Documentation;
