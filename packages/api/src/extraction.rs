use super::*;
use unclutter::{Parser, ParserOptions};

const MAX_ELEMENTS: usize = 100_000;

const WORDS_PER_MINUTE: usize = 238;

static SANITIZER: LazyLock<ammonia::Builder<'static>> = LazyLock::new(|| {
  let mut builder = ammonia::Builder::default();
  builder.url_schemes(HashSet::from(["http", "https", "mailto"]));
  builder
});

pub(crate) fn extract(html: &str, url: &Url) -> Option<ArticleContent> {
  let options = ParserOptions::builder()
    .max_elements(Some(MAX_ELEMENTS))
    .build();

  let article = Parser::new(html, Some(url.as_str()), options)
    .and_then(Parser::parse)
    .inspect_err(|error| warn!("failed to extract {url}: {error}"))
    .ok()?;

  let content = SANITIZER.clean(&article.content).to_string();

  let text_content = dom_query::Document::fragment(content.as_str())
    .text()
    .to_string();

  let word_count = text_content.split_whitespace().count();

  Some(ArticleContent {
    author: article.byline,
    content,
    dir: article.dir,
    excerpt: article.excerpt,
    lang: article.lang,
    publication_date: article
      .published_time
      .as_deref()
      .and_then(|time| DateTime::parse_from_rfc3339(time).ok())
      .map(|time| time.with_timezone(&Utc)),
    reading_time_minutes: i32::try_from(word_count.div_ceil(WORDS_PER_MINUTE))
      .unwrap_or(i32::MAX),
    site_name: article.site_name,
    text_content,
    title: Some(article.title).filter(|title| !title.is_empty()),
    word_count: i32::try_from(word_count).unwrap_or(i32::MAX),
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn extract() {
    let html = r#"<html>
<head>
<title>Foo</title>
<meta name="author" content="Bar">
<meta property="article:published_time" content="2024-01-02T03:04:05Z">
<script>alert(1)</script>
</head>
<body>
<article>
<p onclick="alert(1)">foo bar baz</p>
<p><a href="javascript:alert(1)">qux</a> <a href="/quux">corge</a></p>
</article>
</body>
</html>"#;

    assert_eq!(
      super::extract(html, &Url::parse("https://foo.com/bar").unwrap()),
      Some(ArticleContent {
        author: Some("Bar".into()),
        content: "<div>\n<article>\n<p>foo bar baz</p>\n<p>qux <a href=\"https://foo.com/quux\" rel=\"noopener noreferrer\">corge</a></p>\n</article>\n\n</div>".into(),
        dir: None,
        excerpt: Some("foo bar baz".into()),
        lang: None,
        publication_date: Some(
          "2024-01-02T03:04:05Z".parse::<DateTime<Utc>>().unwrap()
        ),
        reading_time_minutes: 1,
        site_name: None,
        text_content: "\n\nfoo bar baz\nqux corge\n\n\n".into(),
        title: Some("Foo".into()),
        word_count: 5,
      }),
    );
  }

  #[test]
  fn extract_too_many_elements() {
    assert_eq!(
      super::extract(
        &"<p></p>".repeat(MAX_ELEMENTS + 1),
        &Url::parse("https://foo.com").unwrap(),
      ),
      None,
    );
  }
}
