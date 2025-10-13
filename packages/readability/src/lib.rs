use {
  html5ever::{Attribute, tendril::StrTendril},
  markup5ever_rcdom::{
    Handle, Node,
    NodeData::{Element, Text},
  },
  std::{io, rc::Rc, str::FromStr},
};

mod dom;
mod error;
mod extractor;
mod scorer;

pub use {
  error::Error,
  extractor::{
    Extractor, ExtractorBuilder, ExtractorConfig, Product, SanitizerOptions,
  },
};
