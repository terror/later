use {
  error::Result,
  html5ever::{
    Attribute, LocalName, QualName, namespace_url, ns, parse_document,
    serialize,
    tendril::{StrTendril, stream::TendrilSink},
    tree_builder::{ElementFlags, NodeOrText, TreeSink},
  },
  lazy_static::lazy_static,
  markup5ever_rcdom::{Handle, Node, NodeData, RcDom, SerializableHandle},
  regex::Regex,
  scorer::{Candidate, Scorer},
  std::{
    cell::Cell,
    collections::BTreeMap,
    io::{self, Read},
    path::Path,
    rc::Rc,
    str::FromStr,
  },
  url::Url,
};

#[cfg(feature = "reqwest")]
use std::time::Duration;

mod dom;
mod error;
mod extractor;
mod product;
mod scorer;

pub use {
  error::Error,
  extractor::{Extractor, ExtractorBuilder, ExtractorConfig, SanitizerOptions},
  product::Product,
};
