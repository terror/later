use super::*;

const ACCEPT: &str = "text/html,application/xhtml+xml";

const AGENT: &str = concat!(
  "Mozilla/5.0 (compatible; later/",
  env!("CARGO_PKG_VERSION"),
  ")"
);

const MAX_BYTES: usize = 10 * 1024 * 1024;

const MAX_REDIRECTS: usize = 5;

const TIMEOUT: Duration = Duration::from_secs(20);

#[derive(Debug, PartialEq)]
pub(crate) struct Page {
  pub(crate) html: String,
  pub(crate) url: Url,
}

struct Pinned(Vec<SocketAddr>);

impl reqwest::dns::Resolve for Pinned {
  fn resolve(&self, _name: reqwest::dns::Name) -> reqwest::dns::Resolving {
    let addrs = self.0.clone();
    Box::pin(
      async move { Ok(Box::new(addrs.into_iter()) as reqwest::dns::Addrs) },
    )
  }
}

#[derive(Clone, Debug)]
pub(crate) struct Fetcher {
  pub(crate) filter: fn(IpAddr) -> bool,
  pub(crate) max_bytes: usize,
  pub(crate) timeout: Duration,
}

impl Default for Fetcher {
  fn default() -> Self {
    Self {
      filter: address::is_public,
      max_bytes: MAX_BYTES,
      timeout: TIMEOUT,
    }
  }
}

impl Fetcher {
  pub(crate) async fn fetch(&self, url: &Url) -> anyhow::Result<Page> {
    time::timeout(self.timeout, self.follow(url))
      .await
      .map_err(|_| anyhow!("timed out fetching `{url}`"))?
  }

  async fn follow(&self, url: &Url) -> anyhow::Result<Page> {
    let mut url = url.clone();

    for _ in 0..=MAX_REDIRECTS {
      let response = self.request(&url).await?;

      if !response.status().is_redirection() {
        return self.read(url, response).await;
      }

      let location = response
        .headers()
        .get(header::LOCATION)
        .ok_or_else(|| anyhow!("redirect from `{url}` has no location"))?
        .to_str()
        .with_context(|| {
          format!("redirect from `{url}` has invalid location")
        })?;

      url = url.join(location).with_context(|| {
        format!("redirect from `{url}` has invalid location")
      })?;
    }

    bail!("too many redirects")
  }

  async fn read(
    &self,
    url: Url,
    mut response: reqwest::Response,
  ) -> anyhow::Result<Page> {
    let status = response.status();

    if !status.is_success() {
      bail!("`{url}` returned {status}");
    }

    let content_type = response
      .headers()
      .get(header::CONTENT_TYPE)
      .and_then(|content_type| content_type.to_str().ok())
      .unwrap_or_default();

    let mime = content_type.split(';').next().unwrap_or_default().trim();

    if !mime.eq_ignore_ascii_case("text/html")
      && !mime.eq_ignore_ascii_case("application/xhtml+xml")
    {
      bail!("`{url}` has unsupported content type `{content_type}`");
    }

    if response.content_length().is_some_and(|length| {
      usize::try_from(length).map_or(true, |length| length > self.max_bytes)
    }) {
      bail!("`{url}` is larger than {} bytes", self.max_bytes);
    }

    let mut body = Vec::new();

    while let Some(chunk) = response.chunk().await? {
      body.extend_from_slice(&chunk);

      if body.len() > self.max_bytes {
        bail!("`{url}` is larger than {} bytes", self.max_bytes);
      }
    }

    let html = String::from_utf8(body)
      .with_context(|| format!("`{url}` is not valid UTF-8"))?;

    Ok(Page { html, url })
  }

  async fn request(&self, url: &Url) -> anyhow::Result<reqwest::Response> {
    if !matches!(url.scheme(), "http" | "https") {
      bail!("unsupported URL scheme `{}`", url.scheme());
    }

    let host = url.host().ok_or_else(|| anyhow!("`{url}` has no host"))?;

    let port = url
      .port_or_known_default()
      .ok_or_else(|| anyhow!("`{url}` has no port"))?;

    let addrs = match host {
      Host::Domain(domain) => net::lookup_host((domain, port))
        .await
        .with_context(|| format!("failed to resolve `{domain}`"))?
        .collect::<Vec<SocketAddr>>(),
      Host::Ipv4(ip) => vec![SocketAddr::new(ip.into(), port)],
      Host::Ipv6(ip) => vec![SocketAddr::new(ip.into(), port)],
    };

    if addrs.is_empty() {
      bail!("`{host}` did not resolve to any addresses");
    }

    if let Some(addr) = addrs.iter().find(|addr| !(self.filter)(addr.ip())) {
      bail!("refusing to connect to `{}`", addr.ip());
    }

    let client = reqwest::Client::builder()
      .dns_resolver(Arc::new(Pinned(addrs)))
      .no_proxy()
      .redirect(reqwest::redirect::Policy::none())
      .user_agent(AGENT)
      .build()?;

    Ok(
      client
        .get(url.clone())
        .header(header::ACCEPT, ACCEPT)
        .send()
        .await?,
    )
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  async fn serve() -> Url {
    let router = Router::new()
      .route("/", get(|| async { axum::response::Html("<p>foo</p>") }))
      .route("/json", get(|| async { Json("foo") }))
      .route(
        "/large",
        get(|| async { axum::response::Html("a".repeat(17)) }),
      )
      .route("/loop", get(|| async { Redirect::to("/loop") }))
      .route("/missing", get(|| async { StatusCode::NOT_FOUND }))
      .route(
        "/private",
        get(|| async { Redirect::temporary("http://10.0.0.1/") }),
      )
      .route("/redirect", get(|| async { Redirect::to("/") }))
      .route(
        "/slow",
        get(|| async {
          time::sleep(Duration::from_secs(1)).await;
          axum::response::Html("<p>foo</p>")
        }),
      )
      .route(
        "/utf-16",
        get(|| async {
          ([(header::CONTENT_TYPE, "text/html")], vec![0xff, 0xfe])
        }),
      );

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();

    let addr = listener.local_addr().unwrap();

    task::spawn(async move { axum::serve(listener, router).await.unwrap() });

    Url::parse(&format!("http://{addr}/")).unwrap()
  }

  fn fetcher() -> Fetcher {
    Fetcher {
      filter: |ip| ip.is_loopback(),
      max_bytes: 16,
      timeout: Duration::from_millis(200),
    }
  }

  #[tokio::test]
  async fn fetch() {
    let url = serve().await;

    assert_eq!(
      fetcher()
        .fetch(&url.join("redirect").unwrap())
        .await
        .unwrap(),
      Page {
        html: "<p>foo</p>".into(),
        url: url.clone(),
      },
    );

    let localhost =
      Url::parse(&format!("http://localhost:{}/", url.port().unwrap()))
        .unwrap();

    assert_eq!(
      fetcher().fetch(&localhost).await.unwrap(),
      Page {
        html: "<p>foo</p>".into(),
        url: localhost,
      },
    );
  }

  #[tokio::test]
  async fn fetch_errors() {
    async fn case(fetcher: Fetcher, url: &Url, expected: &str) {
      assert_eq!(
        format!("{:#}", fetcher.fetch(url).await.unwrap_err()),
        expected,
      );
    }

    let url = serve().await;

    let path = |path: &str| url.join(path).unwrap();

    case(
      fetcher(),
      &Url::parse("ftp://foo/").unwrap(),
      "unsupported URL scheme `ftp`",
    )
    .await;

    case(
      Fetcher::default(),
      &url,
      "refusing to connect to `127.0.0.1`",
    )
    .await;

    case(
      fetcher(),
      &path("private"),
      "refusing to connect to `10.0.0.1`",
    )
    .await;

    case(fetcher(), &path("loop"), "too many redirects").await;

    case(
      fetcher(),
      &path("missing"),
      &format!("`{}` returned 404 Not Found", path("missing")),
    )
    .await;

    case(
      fetcher(),
      &path("json"),
      &format!(
        "`{}` has unsupported content type `application/json`",
        path("json"),
      ),
    )
    .await;

    case(
      fetcher(),
      &path("large"),
      &format!("`{}` is larger than 16 bytes", path("large")),
    )
    .await;

    case(
      fetcher(),
      &path("utf-16"),
      &format!(
        "`{}` is not valid UTF-8: invalid utf-8 sequence of 1 bytes from index 0",
        path("utf-16"),
      ),
    )
    .await;

    case(
      fetcher(),
      &path("slow"),
      &format!("timed out fetching `{}`", path("slow")),
    )
    .await;
  }
}
