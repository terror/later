import type { Article, User } from '../src/lib/types';

export const now = new Date('2026-03-12T12:00:00Z');

export const token = 'foo';

export const content = '<p>qux</p>';

export const user: User = {
  user_id: '00000000-0000-0000-0000-000000000001',
  email: 'foo@example.com',
  name: 'Foo Bar',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function article(
  index: number,
  title: string,
  fields: Pick<Article, 'date_saved'> & Partial<Article>
): Article {
  return {
    article_id: `00000000-0000-0000-0000-00000000010${index}`,
    url: `https://example.com/${title}`,
    title,
    author: null,
    excerpt: null,
    site_name: null,
    lang: 'en',
    dir: null,
    publication_date: null,
    word_count: 238,
    reading_time_minutes: 1,
    is_archived: false,
    is_favorited: false,
    date_read: null,
    ...fields,
  };
}

export const foo = article(1, 'foo', { date_saved: '2026-03-12T11:00:00Z' });

export const bar = article(2, 'bar', {
  date_saved: '2026-03-11T12:00:00Z',
  is_favorited: true,
});

export const baz = article(3, 'baz', {
  date_saved: '2026-03-01T12:00:00Z',
  is_archived: true,
});

export const articles = [bar, foo, baz];
