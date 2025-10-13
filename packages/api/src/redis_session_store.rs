use super::*;
use redis::Script;

#[derive(Clone)]
pub struct RedisSessionStore {
  manager: ConnectionManager,
  prefix: String,
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
    Self::new_with_prefix(connection_info, "session:").await
  }

  pub async fn new_with_prefix(
    connection_info: impl IntoConnectionInfo,
    prefix: impl Into<String>,
  ) -> RedisResult<Self> {
    let client = Client::open(connection_info)?;

    let manager = ConnectionManager::new(client).await?;

    Ok(Self {
      manager,
      prefix: prefix.into(),
    })
  }

  fn prefix_key(&self, key: impl AsRef<str>) -> String {
    format!("{}{}", self.prefix, key.as_ref())
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

    let record = connection
      .get::<_, Option<String>>(self.prefix_key(id))
      .await?;

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

    let script = Script::new(
      r#"
        local key = KEYS[1]
        local value = ARGV[1]
        local ttl = tonumber(ARGV[2])
        local has_ttl = tonumber(ARGV[3])

        if redis.call("SETNX", key, value) == 1 then
          if has_ttl == 1 then
            redis.call("PEXPIRE", key, ttl)
          end

          return 1
        end

        if has_ttl == 1 then
          redis.call("SET", key, value, "PX", ttl)
        else
          redis.call("SET", key, value)
        end

        return 0
      "#,
    );

    let ttl_ms = expiry
      .map(|duration| duration.as_millis() as i64)
      .unwrap_or_default();

    let has_ttl_flag = if expiry.is_some() { 1_i64 } else { 0 };

    let inserted = script
      .prepare_invoke()
      .key(&id)
      .arg(&string)
      .arg(ttl_ms)
      .arg(has_ttl_flag)
      .invoke_async::<i64>(&mut connection)
      .await?;

    if inserted == 1 {
      Ok(session.into_cookie_value())
    } else {
      Ok(None)
    }
  }

  async fn destroy_session(&self, session: Session) -> async_session::Result {
    let mut connection = self.manager.clone();

    let key = self.prefix_key(session.id());

    let _deleted = connection.del::<_, usize>(key).await?;

    Ok(())
  }

  async fn clear_store(&self) -> async_session::Result {
    let mut connection = self.manager.clone();

    let pattern = self.prefix_key("*");

    let mut cursor = 0;

    loop {
      let (next_cursor, keys) = redis::cmd("SCAN")
        .arg(cursor)
        .arg("MATCH")
        .arg(&pattern)
        .arg("COUNT")
        .arg(128usize)
        .query_async::<(u64, Vec<String>)>(&mut connection)
        .await?;

      if !keys.is_empty() {
        let _deleted = redis::cmd("DEL")
          .arg(keys)
          .query_async::<usize>(&mut connection)
          .await?;
      }

      if next_cursor == 0 {
        break;
      }

      cursor = next_cursor;
    }

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use {
    super::*,
    std::{
      sync::atomic::{AtomicUsize, Ordering},
      time::Duration,
    },
    tokio::time::sleep,
  };

  fn unique_prefix() -> String {
    static COUNTER: AtomicUsize = AtomicUsize::new(0);
    let id = COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("session:test:{id}:")
  }

  async fn store_with_prefix(prefix: impl Into<String>) -> RedisSessionStore {
    let store =
      RedisSessionStore::new_with_prefix("redis://127.0.0.1:6379", prefix)
        .await
        .unwrap();

    store.clear_store().await.unwrap();

    store
  }

  async fn store() -> RedisSessionStore {
    store_with_prefix(unique_prefix()).await
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

    assert!(loaded_session.get::<bool>("bool_key").unwrap());

    assert_eq!(
      "string_value",
      &loaded_session.get::<String>("string_key").unwrap()
    );

    assert_eq!(42i32, loaded_session.get::<i32>("number_key").unwrap());
  }

  #[tokio::test]
  async fn custom_prefix_applied_to_keys() {
    let store = store_with_prefix("custom:").await;

    let mut session = Session::new();
    session.insert("k", "v").unwrap();

    let session_id = session.id().to_string();

    store.store_session(session).await.unwrap().unwrap();

    let mut connection =
      ConnectionManager::new(Client::open("redis://127.0.0.1:6379").unwrap())
        .await
        .unwrap();

    let keys = redis::cmd("KEYS")
      .arg("custom:*")
      .query_async::<Vec<String>>(&mut connection)
      .await
      .unwrap();

    assert_eq!(1, keys.len());
    assert_eq!(format!("custom:{session_id}"), keys[0]);

    store.clear_store().await.unwrap();
  }

  #[tokio::test]
  async fn clear_store_preserves_unrelated_keys() {
    let store = store().await;

    let mut session = Session::new();
    session.insert("keep", "me").unwrap();

    let key = store.prefix_key(session.id());

    store.store_session(session).await.unwrap();

    let mut connection =
      ConnectionManager::new(Client::open("redis://127.0.0.1:6379").unwrap())
        .await
        .unwrap();

    let _ = redis::cmd("SET")
      .arg("unrelated:key")
      .arg("still_here")
      .query_async::<String>(&mut connection)
      .await
      .unwrap();

    store.clear_store().await.unwrap();

    let session_exists = redis::cmd("EXISTS")
      .arg(&key)
      .query_async::<i64>(&mut connection)
      .await
      .unwrap();

    assert_eq!(0, session_exists);

    let unrelated_value = redis::cmd("GET")
      .arg("unrelated:key")
      .query_async::<Option<String>>(&mut connection)
      .await
      .unwrap();

    assert_eq!(Some("still_here".to_string()), unrelated_value);

    let _ = redis::cmd("DEL")
      .arg("unrelated:key")
      .query_async::<i64>(&mut connection)
      .await
      .unwrap();
  }

  #[tokio::test]
  async fn ttl_is_applied_on_insert_and_update() {
    let store = store().await;

    let mut session = Session::new();
    session.insert("key", "value").unwrap();
    session.expire_in(Duration::from_secs(2));

    let key = store.prefix_key(session.id());

    let cookie_value = store.store_session(session).await.unwrap().unwrap();

    let mut connection =
      ConnectionManager::new(Client::open("redis://127.0.0.1:6379").unwrap())
        .await
        .unwrap();

    let ttl_initial = redis::cmd("PTTL")
      .arg(&key)
      .query_async::<i64>(&mut connection)
      .await
      .unwrap();

    assert!(ttl_initial > 0);
    assert!(ttl_initial <= 2000);

    let mut loaded_session = store
      .load_session(cookie_value.clone())
      .await
      .unwrap()
      .unwrap();

    loaded_session.insert("key", "updated").unwrap();
    loaded_session.expire_in(Duration::from_secs(5));

    let updated_cookie = store.store_session(loaded_session).await.unwrap();
    assert!(updated_cookie.is_none());

    let ttl_updated = redis::cmd("PTTL")
      .arg(&key)
      .query_async::<i64>(&mut connection)
      .await
      .unwrap();

    assert!(ttl_updated > 2000);
    assert!(ttl_updated <= 5000);

    store.clear_store().await.unwrap();
  }
}
