use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "sqlx", derive(FromRow))]
#[cfg_attr(feature = "tsify", derive(Tsify))]
pub struct ArticleWithContent {
  #[serde(flatten)]
  #[cfg_attr(feature = "sqlx", sqlx(flatten))]
  pub article: Article,
  pub content: Option<String>,
}

#[cfg(test)]
mod tests {
  use {super::*, serde_json::json};

  #[test]
  fn serialize() {
    assert_eq!(
      serde_json::to_value(ArticleWithContent {
        article: Article {
          article_id: Uuid::nil(),
          url: "foo".into(),
          title: None,
          author: None,
          excerpt: None,
          site_name: None,
          lang: None,
          dir: None,
          publication_date: None,
          word_count: None,
          reading_time_minutes: None,
          is_archived: false,
          is_favorited: false,
          date_saved: DateTime::UNIX_EPOCH,
          date_read: None,
          progress: ReadingProgress {
            scroll_position: 0.0,
            time_spent_seconds: 0,
          },
        },
        content: Some("bar".into()),
      })
      .unwrap(),
      json!({
        "article_id": "00000000-0000-0000-0000-000000000000",
        "url": "foo",
        "title": null,
        "author": null,
        "excerpt": null,
        "site_name": null,
        "lang": null,
        "dir": null,
        "publication_date": null,
        "word_count": null,
        "reading_time_minutes": null,
        "is_archived": false,
        "is_favorited": false,
        "date_saved": "1970-01-01T00:00:00Z",
        "date_read": null,
        "progress": {
          "scroll_position": 0.0,
          "time_spent_seconds": 0,
        },
        "content": "bar",
      }),
    );
  }
}
