ALTER TABLE articles
  ADD CONSTRAINT articles_article_id_user_id_key UNIQUE (article_id, user_id);

ALTER TABLE highlights
  DROP CONSTRAINT highlights_article_id_fkey,
  ADD CONSTRAINT highlights_article_id_user_id_fkey
    FOREIGN KEY (article_id, user_id)
    REFERENCES articles (article_id, user_id)
    ON DELETE CASCADE,
  ALTER COLUMN color SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;
