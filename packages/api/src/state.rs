use super::*;

#[derive(Debug, Clone)]
pub(crate) struct ClientOrigin(String);

impl ClientOrigin {
  pub(crate) fn new(origin: String) -> Self {
    Self(origin)
  }

  pub(crate) fn as_str(&self) -> &str {
    self.0.as_str()
  }
}

#[derive(Debug, Clone)]
pub(crate) struct State {
  pub(crate) db: Db,
  pub(crate) oauth_client: auth::ConfiguredOAuthClient,
  pub(crate) session_store: RedisSessionStore,
  pub(crate) client_origin: ClientOrigin,
}

impl FromRef<State> for Db {
  fn from_ref(state: &State) -> Self {
    state.db.clone()
  }
}

impl FromRef<State> for auth::ConfiguredOAuthClient {
  fn from_ref(state: &State) -> Self {
    state.oauth_client.clone()
  }
}

impl FromRef<State> for RedisSessionStore {
  fn from_ref(state: &State) -> Self {
    state.session_store.clone()
  }
}

impl FromRef<State> for ClientOrigin {
  fn from_ref(state: &State) -> Self {
    state.client_origin.clone()
  }
}
