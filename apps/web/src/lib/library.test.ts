import { describe, expect, test } from 'bun:test';

import { countArticles, filterArticles } from './library';
import type { Article } from './types';

function article(fields: Partial<Article>): Article {
  return {
    article_id: 'foo',
    url: 'https://foo.com/',
    title: null,
    author: null,
    excerpt: null,
    site_name: null,
    lang: null,
    dir: null,
    publication_date: null,
    word_count: null,
    reading_time_minutes: null,
    is_archived: false,
    is_favorited: false,
    date_saved: '2026-03-12T00:00:00Z',
    date_read: null,
    ...fields,
  };
}

const articles = [
  article({
    article_id: 'a',
    title: 'Foo',
    date_saved: '2026-03-10T00:00:00Z',
  }),
  article({
    article_id: 'b',
    title: 'Bar',
    site_name: 'Baz',
    is_favorited: true,
    date_saved: '2026-03-12T00:00:00Z',
  }),
  article({
    article_id: 'c',
    title: 'Qux',
    author: 'Bob',
    is_archived: true,
    is_favorited: true,
    date_saved: '2026-03-11T00:00:00Z',
  }),
];

describe('filterArticles', () => {
  test('filters by view and query and sorts by date saved', () => {
    const case_ = (
      options: Parameters<typeof filterArticles>[1],
      expected: string[]
    ) =>
      expect(
        filterArticles(articles, options).map(({ article_id }) => article_id)
      ).toEqual(expected);

    case_({ view: 'inbox', query: '', sort: 'newest' }, ['b', 'a']);
    case_({ view: 'inbox', query: '', sort: 'oldest' }, ['a', 'b']);
    case_({ view: 'favorites', query: '', sort: 'newest' }, ['b', 'c']);
    case_({ view: 'archive', query: '', sort: 'newest' }, ['c']);
    case_({ view: 'inbox', query: ' baz ', sort: 'newest' }, ['b']);
    case_({ view: 'archive', query: 'bob', sort: 'newest' }, ['c']);
    case_({ view: 'inbox', query: 'foo.com', sort: 'newest' }, ['b', 'a']);
  });
});

describe('countArticles', () => {
  test('counts articles in each view', () => {
    expect(countArticles(articles)).toEqual({
      inbox: 2,
      favorites: 2,
      archive: 1,
    });
  });
});
