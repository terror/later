use super::*;

const X_FORWARDED_FOR: &str = "x-forwarded-for";

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub(crate) enum RateLimitKey {
  Ip(IpAddr),
  User(Uuid),
}

#[derive(Clone, Debug)]
pub(crate) struct RateLimitKeyExtractor {
  pub(crate) trusted_proxies: usize,
}

impl RateLimitKeyExtractor {
  fn client_ip<T>(&self, request: &Request<T>) -> Option<IpAddr> {
    let peer = request
      .extensions()
      .get::<ConnectInfo<SocketAddr>>()
      .map(|ConnectInfo(addr)| addr.ip());

    let forwarded = request
      .headers()
      .get_all(X_FORWARDED_FOR)
      .iter()
      .filter_map(|value| value.to_str().ok())
      .flat_map(|value| value.split(','))
      .map(str::trim)
      .collect::<Vec<&str>>();

    forwarded
      .len()
      .checked_sub(self.trusted_proxies)
      .filter(|_| self.trusted_proxies > 0)
      .and_then(|index| forwarded[index].parse::<IpAddr>().ok())
      .or(peer)
  }
}

impl KeyExtractor for RateLimitKeyExtractor {
  type Key = RateLimitKey;

  fn extract<T>(
    &self,
    request: &Request<T>,
  ) -> Result<RateLimitKey, GovernorError> {
    if let Some(user) = request.extensions().get::<User>() {
      return Ok(RateLimitKey::User(user.user_id));
    }

    self
      .client_ip(request)
      .map(RateLimitKey::Ip)
      .ok_or(GovernorError::UnableToExtractKey)
  }
}

pub(crate) async fn authenticate(
  user: Option<User>,
  mut request: Request<Body>,
  next: Next,
) -> Response {
  if let Some(user) = user {
    request.extensions_mut().insert(user);
  }

  next.run(request).await
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn extract() {
    #[track_caller]
    fn case(
      trusted_proxies: usize,
      forwarded: &[&str],
      user: Option<Uuid>,
      expected: Option<RateLimitKey>,
    ) {
      let mut request = Request::new(());

      request
        .extensions_mut()
        .insert(ConnectInfo(SocketAddr::from(([10, 0, 0, 1], 80))));

      for value in forwarded {
        request
          .headers_mut()
          .append(X_FORWARDED_FOR, value.parse().unwrap());
      }

      if let Some(user_id) = user {
        request.extensions_mut().insert(User(model::User {
          user_id,
          email: "foo@bar.com".into(),
          name: None,
          created_at: DateTime::UNIX_EPOCH,
          updated_at: DateTime::UNIX_EPOCH,
        }));
      }

      assert_eq!(
        RateLimitKeyExtractor { trusted_proxies }
          .extract(&request)
          .ok(),
        expected,
      );
    }

    let peer = Some(RateLimitKey::Ip([10, 0, 0, 1].into()));

    let ip = |ip: [u8; 4]| Some(RateLimitKey::Ip(ip.into()));

    case(0, &[], None, peer.clone());
    case(0, &["1.1.1.1"], None, peer.clone());
    case(1, &[], None, peer.clone());
    case(1, &["1.1.1.1"], None, ip([1, 1, 1, 1]));
    case(1, &["2.2.2.2, 1.1.1.1"], None, ip([1, 1, 1, 1]));
    case(1, &["2.2.2.2", "1.1.1.1"], None, ip([1, 1, 1, 1]));
    case(2, &["3.3.3.3, 2.2.2.2, 1.1.1.1"], None, ip([2, 2, 2, 2]));
    case(2, &["1.1.1.1"], None, peer.clone());
    case(1, &["foo"], None, peer);
    case(
      1,
      &["1.1.1.1"],
      Some(Uuid::nil()),
      Some(RateLimitKey::User(Uuid::nil())),
    );
  }
}
