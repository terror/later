use super::*;

#[derive(Clone)]
pub struct RedisSessionStore {
  manager: ConnectionManager,
  prefix: Option<String>,
}

impl Debug for RedisSessionStore {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("RedisSessionStore")
      .field("prefix", &self.prefix)
      .finish()
  }
}

impl RedisSessionStore {
  pub async fn new(
    connection_info: impl IntoConnectionInfo,
  ) -> RedisResult<Self> {
    let client = Client::open(connection_info)?;

    let manager = ConnectionManager::new(client).await?;

    Ok(Self {
      manager,
      prefix: None,
    })
  }

  fn prefix_key(&self, key: impl AsRef<str>) -> String {
    if let Some(ref prefix) = self.prefix {
      format!("{}{}", prefix, key.as_ref())
    } else {
      key.as_ref().into()
    }
  }
}

#[async_trait]
impl SessionStore for RedisSessionStore {
  async fn load_session(
    &self,
    cookie_value: String,
  ) -> async_session::Result<Option<Session>> {
    let id = Session::id_from_cookie_value(&cookie_value)?;

    let mut connection = self.manager.clone();

    let record: Option<String> = connection.get(self.prefix_key(id)).await?;

    match record {
      Some(value) => Ok(serde_json::from_str(&value)?),
      None => Ok(None),
    }
  }

  async fn store_session(
    &self,
    session: Session,
  ) -> async_session::Result<Option<String>> {
    let id = self.prefix_key(session.id());

    let string = serde_json::to_string(&session)?;

    let expiry = session.expires_in();

    let mut connection = self.manager.clone();

    let exists: bool = connection.exists(&id).await?;

    match expiry {
      None => {
        let _: () = connection.set(id, string).await?;
      }
      Some(expiry) => {
        let _: () = connection.set_ex(id, string, expiry.as_secs()).await?;
      }
    };

    if exists {
      Ok(None)
    } else {
      Ok(session.into_cookie_value())
    }
  }

  async fn destroy_session(&self, session: Session) -> async_session::Result {
    let mut connection = self.manager.clone();

    let key = self.prefix_key(session.id().to_string());

    let _: () = connection.del(key).await?;

    Ok(())
  }

  async fn clear_store(&self) -> async_session::Result {
    let mut connection = self.manager.clone();

    if self.prefix.is_none() {
      let _: () = redis::cmd("FLUSHDB").query_async(&mut connection).await?;
    } else {
      let ids: Vec<String> = connection.keys(self.prefix_key("*")).await?;

      if !ids.is_empty() {
        let _: () = connection.del(ids).await?;
      }
    }

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use {super::*, std::time::Duration, tokio::time::sleep};

  async fn store() -> RedisSessionStore {
    let store = RedisSessionStore::new("redis://127.0.0.1:6379")
      .await
      .unwrap();

    store.clear_store().await.unwrap();

    store
  }

  #[tokio::test]
  async fn store_and_load_session() {
    let store = store().await;

    let mut session = Session::new();

    session.insert("key", "value").unwrap();

    let cloned = session.clone();

    let cookie_value = store.store_session(session).await.unwrap().unwrap();

    let loaded_session =
      store.load_session(cookie_value).await.unwrap().unwrap();

    assert!(!loaded_session.is_expired());

    assert_eq!(cloned.id(), loaded_session.id());
    assert_eq!("value", &loaded_session.get::<String>("key").unwrap());
  }

  #[tokio::test]
  async fn update_session() {
    let store = store().await;

    let mut session = Session::new();

    session.insert("key", "value").unwrap();

    let cookie_value = store.store_session(session).await.unwrap().unwrap();

    let mut session = store
      .load_session(cookie_value.clone())
      .await
      .unwrap()
      .unwrap();

    session.insert("key", "updated_value").unwrap();

    assert_eq!(None, store.store_session(session).await.unwrap());

    let session = store.load_session(cookie_value).await.unwrap().unwrap();

    assert_eq!("updated_value", &session.get::<String>("key").unwrap());
  }

  #[tokio::test]
  async fn session_with_expiry() {
    let store = store().await;

    let mut session = Session::new();

    session.expire_in(Duration::from_secs(2));

    session.insert("key", "value").unwrap();

    let cookie_value = store.store_session(session).await.unwrap().unwrap();

    let loaded_session = store
      .load_session(cookie_value.clone())
      .await
      .unwrap()
      .unwrap();

    assert_eq!("value", &loaded_session.get::<String>("key").unwrap());

    sleep(Duration::from_secs(3)).await;

    assert_eq!(None, store.load_session(cookie_value).await.unwrap());
  }

  #[tokio::test]
  async fn destroy_session() {
    let store = store().await;

    let mut session = Session::new();

    session.insert("test", "value").unwrap();

    let cookie_value = store.store_session(session).await.unwrap().unwrap();

    let loaded_session =
      store.load_session(cookie_value.clone()).await.unwrap();

    assert!(loaded_session.is_some());

    let session_to_destroy = store
      .load_session(cookie_value.clone())
      .await
      .unwrap()
      .unwrap();

    store.destroy_session(session_to_destroy).await.unwrap();

    assert_eq!(None, store.load_session(cookie_value).await.unwrap());
  }

  #[tokio::test]
  async fn clear_store() {
    let store = store().await;

    for i in 0..3 {
      let mut session = Session::new();
      session.insert("key", format!("value_{}", i)).unwrap();
      store.store_session(session).await.unwrap();
    }

    store.clear_store().await.unwrap();

    let mut session = Session::new();

    session.insert("test", "after_clear").unwrap();

    let cookie_value = store.store_session(session).await.unwrap().unwrap();

    let loaded = store.load_session(cookie_value).await.unwrap().unwrap();

    assert_eq!("after_clear", &loaded.get::<String>("test").unwrap());
  }

  #[tokio::test]
  async fn nonexistent_session() {
    let store = store().await;

    let fake_session = Session::new();

    assert_eq!(
      None,
      store
        .load_session(fake_session.into_cookie_value().unwrap())
        .await
        .unwrap()
    );
  }

  #[tokio::test]
  async fn multiple_values_in_session() {
    let store = store().await;

    let mut session = Session::new();
    session.insert("string_key", "string_value").unwrap();
    session.insert("number_key", 42i32).unwrap();
    session.insert("bool_key", true).unwrap();

    let cookie_value = store.store_session(session).await.unwrap().unwrap();

    let loaded_session =
      store.load_session(cookie_value).await.unwrap().unwrap();

    assert_eq!(
      "string_value",
      &loaded_session.get::<String>("string_key").unwrap()
    );

    assert_eq!(42i32, loaded_session.get::<i32>("number_key").unwrap());
    assert_eq!(true, loaded_session.get::<bool>("bool_key").unwrap());
  }
}
