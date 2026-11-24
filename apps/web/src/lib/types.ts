export type Provider = 'github' | 'google';

export interface User {
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
  article_id: string;
  url: string;
  title: string | null;
  author: string | null;
  excerpt: string | null;
  site_name: string | null;
  lang: string | null;
  dir: string | null;
  publication_date: string | null;
  word_count: number | null;
  reading_time_minutes: number | null;
  is_archived: boolean;
  is_favorited: boolean;
  date_saved: string;
  date_read: string | null;
}

export interface ArticleWithContent extends Article {
  content: string | null;
}
