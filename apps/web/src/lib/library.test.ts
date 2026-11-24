import type { Article } from '@later/types';
import { describe, expect, test } from 'bun:test';

import {
  applyUpdate,
  countArticles,
  filterArticles,
  patchArticle,
  removeArticle,
} from './library';

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
    progress: { scroll_position: 0, time_spent_seconds: 0 },
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
  test.each<[Parameters<typeof filterArticles>[1], string[]]>([
    [{ view: 'inbox', query: '', sort: 'newest' }, ['b', 'a']],
    [{ view: 'inbox', query: '', sort: 'oldest' }, ['a', 'b']],
    [{ view: 'favorites', query: '', sort: 'newest' }, ['b', 'c']],
    [{ view: 'archive', query: '', sort: 'newest' }, ['c']],
    [{ view: 'inbox', query: ' baz ', sort: 'newest' }, ['b']],
    [{ view: 'archive', query: 'bob', sort: 'newest' }, ['c']],
    [{ view: 'inbox', query: 'foo.com', sort: 'newest' }, ['b', 'a']],
  ])('filters %p to %p', (options, expected) => {
    expect(
      filterArticles(articles, options).map(({ article_id }) => article_id)
    ).toEqual(expected);
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

describe('patchArticle', () => {
  test('updates only the matching article', () => {
    expect(
      patchArticle(articles, 'b', (article) => ({
        ...article,
        is_archived: true,
      }))
    ).toEqual([
      articles[0],
      { ...articles[1], is_archived: true },
      articles[2],
    ]);
  });
});

describe('applyUpdate', () => {
  const now = new Date('2026-03-12T15:00:00Z');

  test.each<
    [Partial<Article>, Parameters<typeof applyUpdate>[1], Partial<Article>]
  >([
    [{}, { is_favorited: true }, { is_favorited: true }],
    [{}, { is_read: true }, { date_read: '2026-03-12T15:00:00.000Z' }],
    [
      { date_read: '2026-03-10T00:00:00Z' },
      { is_read: true },
      { date_read: '2026-03-10T00:00:00Z' },
    ],
    [{ date_read: '2026-03-10T00:00:00Z' }, { is_read: false }, {}],
    [
      { date_read: '2026-03-10T00:00:00Z' },
      { is_archived: true },
      { date_read: '2026-03-10T00:00:00Z', is_archived: true },
    ],
  ])('applies %p with %p', (fields, update, expected) => {
    expect(applyUpdate(article(fields), update, now)).toEqual(
      article(expected)
    );
  });
});

describe('removeArticle', () => {
  test('removes only the matching article', () => {
    expect(removeArticle(articles, 'b')).toEqual([articles[0], articles[2]]);
  });
});
