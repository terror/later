use super::*;

#[derive(Debug, Clone)]
pub(crate) struct State {
  pub(crate) allowed_origins: AllowedOrigins,
  pub(crate) db: Db,
  pub(crate) oauth_client: auth::ConfiguredOAuthClient,
  pub(crate) session_store: RedisSessionStore,
}

impl FromRef<State> for AllowedOrigins {
  fn from_ref(state: &State) -> Self {
    state.allowed_origins.clone()
  }
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
