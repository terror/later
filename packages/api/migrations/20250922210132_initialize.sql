CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE articles (
  article_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(500),
  content TEXT,
  excerpt TEXT,
  author VARCHAR(255),
  publication_date TIMESTAMP WITH TIME ZONE,
  word_count INTEGER,
  reading_time_minutes INTEGER,
  is_archived BOOLEAN DEFAULT FALSE,
  is_favorited BOOLEAN DEFAULT FALSE,
  date_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_read TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, url)
);

CREATE TABLE tags (
  tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(article_id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(tag_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE collections (
  collection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE collection_articles (
  collection_id UUID REFERENCES collections(collection_id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(article_id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (collection_id, article_id)
);

CREATE TABLE highlights (
  highlight_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  selected_text TEXT NOT NULL,
  context_before TEXT,
  context_after TEXT,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#FFEB3B',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (start_offset >= 0 AND end_offset > start_offset)
);

CREATE TABLE reading_progress (
  article_id UUID REFERENCES articles(article_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  scroll_position DECIMAL(5,4) DEFAULT 0.0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id),
  CHECK (scroll_position >= 0.0 AND scroll_position <= 1.0),
  CHECK (time_spent_seconds >= 0)
);

CREATE INDEX idx_articles_user_date_saved ON articles(user_id, date_saved DESC);
CREATE INDEX idx_articles_user_archived ON articles(user_id, is_archived, date_saved DESC);
CREATE INDEX idx_articles_user_favorited ON articles(user_id, is_favorited, date_saved DESC);
CREATE INDEX idx_articles_url ON articles(url);
CREATE INDEX idx_articles_publication_date ON articles(publication_date);

CREATE INDEX idx_highlights_article_user ON highlights(article_id, user_id);
CREATE INDEX idx_highlights_user ON highlights(user_id, created_at DESC);

CREATE INDEX idx_article_tags_tag ON article_tags(tag_id);
CREATE INDEX idx_article_tags_article ON article_tags(article_id);

CREATE INDEX idx_collection_articles_collection ON collection_articles(collection_id, position);
CREATE INDEX idx_collection_articles_article ON collection_articles(article_id);

CREATE INDEX idx_tags_user ON tags(user_id, name);
CREATE INDEX idx_collections_user ON collections(user_id, sort_order);

CREATE INDEX idx_articles_content_search ON articles USING GIN(to_tsvector('english',
  COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')
));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
