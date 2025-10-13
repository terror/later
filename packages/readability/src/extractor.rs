//! Public extraction API and configuration types.

use crate::dom;
use crate::error::{Error, Result};
use crate::scorer::{self, Candidate};
use html5ever::tendril::stream::TendrilSink;
use html5ever::{parse_document, serialize};
use markup5ever_rcdom::{RcDom, SerializableHandle};
use std::cell::Cell;
use std::collections::BTreeMap;
use std::io::Read;
use std::path::Path;
use url::Url;

#[cfg(feature = "reqwest")]
use reqwest;
#[cfg(feature = "reqwest")]
use std::time::Duration;

/// Controls which HTML attributes will be stripped during sanitization.
#[derive(Debug, Clone, Copy)]
pub struct SanitizerOptions {
  /// Remove `id` attributes when `true`.
  pub strip_ids: bool,
  /// Remove `class` attributes when `true`.
  pub strip_classes: bool,
  /// Remove inline `style` attributes when `true`.
  pub strip_styles: bool,
}

impl Default for SanitizerOptions {
  fn default() -> Self {
    Self {
      strip_ids: true,
      strip_classes: true,
      strip_styles: true,
    }
  }
}

impl SanitizerOptions {
  /// Keeps all attributes intact.
  pub fn preserve_all() -> Self {
    Self {
      strip_ids: false,
      strip_classes: false,
      strip_styles: false,
    }
  }
}

/// Fine-grained configuration that influences readability extraction.
#[derive(Debug, Clone, Copy)]
pub struct ExtractorConfig {
  /// Sanitizer behaviour when pruning attributes.
  pub sanitizer: SanitizerOptions,
  /// Threshold used to qualify nodes as potential content candidates.
  pub minimum_candidate_length: usize,
  /// When `true` the plain-text output traverses all descendants.
  pub deep_text_nodes: bool,
}

impl Default for ExtractorConfig {
  fn default() -> Self {
    Self {
      sanitizer: SanitizerOptions::default(),
      minimum_candidate_length: 20,
      deep_text_nodes: true,
    }
  }
}

/// Configurable builder that produces [`Extractor`] instances.
#[derive(Debug, Default, Clone)]
pub struct ExtractorBuilder {
  config: ExtractorConfig,
  #[cfg(feature = "reqwest")]
  client: Option<reqwest::blocking::Client>,
  #[cfg(feature = "reqwest")]
  timeout: Option<Duration>,
}

impl ExtractorBuilder {
  /// Creates a builder with default configuration.
  pub fn new() -> Self {
    Self::default()
  }

  /// Overrides the sanitizer options applied during cleaning.
  pub fn with_sanitizer(mut self, sanitizer: SanitizerOptions) -> Self {
    self.config.sanitizer = sanitizer;
    self
  }

  /// Sets the minimum number of characters a node must contain to become a candidate.
  pub fn with_minimum_candidate_length(mut self, length: usize) -> Self {
    self.config.minimum_candidate_length = length;
    self
  }

  /// Enables or disables deep traversal when building the plain-text result.
  pub fn with_deep_text_nodes(mut self, deep: bool) -> Self {
    self.config.deep_text_nodes = deep;
    self
  }

  #[cfg(feature = "reqwest")]
  /// Injects a pre-configured HTTP client that will be reused for downloads.
  pub fn with_client(mut self, client: reqwest::blocking::Client) -> Self {
    self.client = Some(client);
    self
  }

  #[cfg(feature = "reqwest")]
  /// Sets the request timeout used when building an implicit client.
  pub fn with_timeout(mut self, timeout: Duration) -> Self {
    self.timeout = Some(timeout);
    self
  }

  /// Builds the [`Extractor`].
  pub fn build(self) -> Extractor {
    Extractor {
      config: self.config,
      #[cfg(feature = "reqwest")]
      client: self.client,
      #[cfg(feature = "reqwest")]
      timeout: self.timeout,
    }
  }
}

/// High-level API for extracting readability content out of documents.
#[derive(Debug, Clone)]
pub struct Extractor {
  config: ExtractorConfig,
  #[cfg(feature = "reqwest")]
  client: Option<reqwest::blocking::Client>,
  #[cfg(feature = "reqwest")]
  timeout: Option<Duration>,
}

impl Default for Extractor {
  fn default() -> Self {
    Self::builder().build()
  }
}

impl Extractor {
  /// Returns a builder for constructing a customized extractor.
  pub fn builder() -> ExtractorBuilder {
    ExtractorBuilder::default()
  }

  /// Provides read-only access to the active configuration.
  pub fn config(&self) -> &ExtractorConfig {
    &self.config
  }

  /// Extracts readability data from any [`Read`] implementor.
  pub fn extract<R: Read>(&self, input: &mut R, url: &Url) -> Result<Product> {
    let mut dom = parse_document(RcDom::default(), Default::default())
      .from_utf8()
      .read_from(input)?;

    let mut title = String::new();
    let mut candidates = BTreeMap::new();
    let mut nodes = BTreeMap::new();

    let handle = dom.document.clone();

    scorer::preprocess(&mut dom, handle.clone(), &mut title);

    scorer::find_candidates(
      Path::new("/"),
      handle.clone(),
      &mut candidates,
      &mut nodes,
      self.config.minimum_candidate_length,
    );

    let mut id: &str = "/";

    let mut top_candidate: &Candidate = &Candidate {
      node: handle.clone(),
      score: Cell::new(0.0),
    };

    for (i, c) in candidates.iter() {
      let score =
        c.score.get() * (1.0 - scorer::get_link_density(c.node.clone()));

      c.score.set(score);

      if score <= top_candidate.score.get() {
        continue;
      }

      id = i;

      top_candidate = c;
    }

    let node = top_candidate.node.clone();

    scorer::clean(
      &mut dom,
      Path::new(id),
      node.clone(),
      url,
      &candidates,
      self.config.sanitizer,
    );

    let mut bytes = vec![];

    serialize(
      &mut bytes,
      &SerializableHandle::from(node.clone()),
      Default::default(),
    )?;

    let content = String::from_utf8(bytes)?;

    let mut text = String::new();

    dom::extract_text(node.clone(), &mut text, self.config.deep_text_nodes);

    Ok(Product {
      title,
      content,
      text,
    })
  }

  #[cfg(feature = "reqwest")]
  /// Downloads a document and extracts readability data from it.
  pub fn scrape(&self, url: &str) -> Result<Product> {
    let client = match self.client.clone() {
      Some(client) => client,
      None => {
        let mut builder = reqwest::blocking::Client::builder();

        if let Some(timeout) = self.timeout {
          builder = builder.timeout(timeout);
        }

        builder.build()?
      }
    };

    let mut response = client.get(url).send()?;

    if !response.status().is_success() {
      return Err(Error::Io(std::io::Error::new(
        std::io::ErrorKind::Other,
        format!("unexpected response status: {}", response.status()),
      )));
    }

    let parsed_url = Url::parse(url)?;

    self.extract(&mut response, &parsed_url)
  }
}

/// Result of readability extraction.
#[derive(Debug, Clone)]
pub struct Product {
  /// Extracted `<title>` value.
  pub title: String,
  /// HTML snippet containing the best candidate node.
  pub content: String,
  /// Plain-text representation of the candidate node.
  pub text: String,
}
