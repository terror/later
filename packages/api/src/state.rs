use super::*;

#[derive(Debug, Clone)]
pub(crate) struct State {
  pub(crate) _db: PgPool,
  pub(crate) store: MemoryStore,
  pub(crate) oauth_client: auth::ConfiguredOAuthClient,
}

impl FromRef<State> for MemoryStore {
  fn from_ref(state: &State) -> Self {
    state.store.clone()
  }
}

impl FromRef<State> for auth::ConfiguredOAuthClient {
  fn from_ref(state: &State) -> Self {
    state.oauth_client.clone()
  }
}
