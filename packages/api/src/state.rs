use super::*;

#[derive(Debug, Clone)]
pub(crate) struct State {
  pub(crate) db: Db,
  pub(crate) oauth_client: auth::ConfiguredOAuthClient,
  pub(crate) session_store: RedisSessionStore,
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
