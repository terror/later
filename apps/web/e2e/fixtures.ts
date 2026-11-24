import type { Article, User } from '@later/types';

export const now = new Date('2026-03-12T12:00:00Z');

export const token = 'foo';

export const content = '<p>qux</p>';

export const user: User = {
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'foo@example.com',
  name: 'Foo Bar',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function article(
  index: number,
  title: string,
  fields: Pick<Article, 'dateSaved'> & Partial<Article>
): Article {
  return {
    articleId: `00000000-0000-0000-0000-00000000010${index}`,
    url: `https://example.com/${title}`,
    status: 'extracted',
    title,
    author: null,
    excerpt: null,
    siteName: null,
    lang: 'en',
    dir: null,
    publicationDate: null,
    wordCount: 238,
    readingTimeMinutes: 1,
    isArchived: false,
    isFavorited: false,
    dateRead: null,
    progress: { scrollPosition: 0, timeSpentSeconds: 0 },
    ...fields,
  };
}

export const foo = article(1, 'foo', { dateSaved: '2026-03-12T11:00:00Z' });

export const bar = article(2, 'bar', {
  dateSaved: '2026-03-11T12:00:00Z',
  isFavorited: true,
});

export const baz = article(3, 'baz', {
  dateSaved: '2026-03-01T12:00:00Z',
  isArchived: true,
});

export const articles = [bar, foo, baz];
