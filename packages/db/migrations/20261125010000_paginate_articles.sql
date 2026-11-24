DROP INDEX idx_articles_user_date_saved;

CREATE INDEX idx_articles_user_date_saved ON articles(user_id, date_saved DESC, article_id DESC);
