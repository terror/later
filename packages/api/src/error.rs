use super::*;

#[derive(Debug)]
pub(crate) struct BadRequest(pub(crate) String);

impl Display for BadRequest {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl std::error::Error for BadRequest {}

#[derive(Debug)]
pub(crate) struct Error(pub(crate) anyhow::Error);

impl Display for Error {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl<E> From<E> for Error
where
  E: Into<anyhow::Error>,
{
  fn from(err: E) -> Self {
    Self(err.into())
  }
}

impl IntoResponse for Error {
  fn into_response(self) -> Response {
    let status = if self.0.is::<BadRequest>() {
      StatusCode::BAD_REQUEST
    } else {
      StatusCode::INTERNAL_SERVER_ERROR
    };

    (status, format!("error: {}", self.0)).into_response()
  }
}
