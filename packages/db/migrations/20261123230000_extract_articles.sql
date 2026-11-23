DROP INDEX idx_articles_content_search;

ALTER TABLE articles
  DROP CONSTRAINT articles_user_id_url_key,
  ALTER COLUMN title TYPE TEXT,
  ALTER COLUMN author TYPE TEXT,
  ADD COLUMN normalized_url TEXT,
  ADD COLUMN html TEXT,
  ADD COLUMN text_content TEXT,
  ADD COLUMN site_name TEXT,
  ADD COLUMN lang TEXT,
  ADD COLUMN dir TEXT;

UPDATE articles SET normalized_url = url;

ALTER TABLE articles
  ALTER COLUMN normalized_url SET NOT NULL,
  ADD CONSTRAINT articles_user_id_normalized_url_key UNIQUE (user_id, normalized_url),
  ADD COLUMN search tsvector GENERATED ALWAYS AS (
    to_tsvector('english', LEFT(COALESCE(title, '') || ' ' || COALESCE(text_content, ''), 500000))
  ) STORED;

CREATE INDEX idx_articles_search ON articles USING GIN(search);
