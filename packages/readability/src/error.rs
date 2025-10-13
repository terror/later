use super::*;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  /// Wrapper around I/O errors raised while reading or serializing documents.
  #[error("I/O error: {0}")]
  Io(#[from] io::Error),
  /// Errors originating when normalizing links or resolving the canonical URL.
  #[error("invalid URL: {0}")]
  Url(#[from] url::ParseError),
  /// Occurs when the extracted HTML cannot be represented as UTF-8.
  #[error("invalid UTF-8 sequence: {0}")]
  InvalidUtf8(#[from] std::string::FromUtf8Error),
  /// Network download failures (only available when the `reqwest` feature is enabled).
  #[cfg(feature = "reqwest")]
  #[error("network error: {0}")]
  Network(#[from] reqwest::Error),
}
