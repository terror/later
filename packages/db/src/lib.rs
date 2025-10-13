use {model::User, sqlx::PgPool};

mod db;
mod error;

pub type Result<T = (), E = Error> = std::result::Result<T, E>;

pub use {db::Db, error::Error};
