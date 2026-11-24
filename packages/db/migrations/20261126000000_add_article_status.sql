CREATE TYPE article_status AS ENUM ('pending', 'extracted', 'failed');

ALTER TABLE articles
  ADD COLUMN status article_status NOT NULL DEFAULT 'extracted',
  ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

UPDATE articles SET status = 'pending' WHERE content IS NULL;

CREATE INDEX idx_articles_pending ON articles(next_attempt_at) WHERE status = 'pending';
