import type { Article } from '@later/types';
import { describe, expect, test } from 'bun:test';

import {
  POLL_INTERVAL,
  applyUpdate,
  countArticles,
  filterArticles,
  mapPages,
  patchArticle,
  pendingArticle,
  pollInterval,
  prependArticle,
  removeArticle,
  replaceArticle,
} from './library';

function article(fields: Partial<Article>): Article {
  return {
    articleId: 'foo',
    url: 'https://foo.com/',
    status: 'extracted',
    title: null,
    author: null,
    excerpt: null,
    siteName: null,
    lang: null,
    dir: null,
    publicationDate: null,
    wordCount: null,
    readingTimeMinutes: null,
    isArchived: false,
    isFavorited: false,
    dateSaved: '2026-03-12T00:00:00Z',
    dateRead: null,
    progress: { scrollPosition: 0, timeSpentSeconds: 0 },
    ...fields,
  };
}

const articles = [
  article({
    articleId: 'a',
    title: 'Foo',
    dateSaved: '2026-03-10T00:00:00Z',
  }),
  article({
    articleId: 'b',
    title: 'Bar',
    siteName: 'Baz',
    isFavorited: true,
    dateSaved: '2026-03-12T00:00:00Z',
  }),
  article({
    articleId: 'c',
    title: 'Qux',
    author: 'Bob',
    isArchived: true,
    isFavorited: true,
    dateSaved: '2026-03-11T00:00:00Z',
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
      filterArticles(articles, options).map(({ articleId }) => articleId)
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
        isArchived: true,
      }))
    ).toEqual([articles[0], { ...articles[1], isArchived: true }, articles[2]]);
  });
});

describe('applyUpdate', () => {
  const now = new Date('2026-03-12T15:00:00Z');

  test.each<
    [Partial<Article>, Parameters<typeof applyUpdate>[1], Partial<Article>]
  >([
    [{}, { isFavorited: true }, { isFavorited: true }],
    [{}, { isRead: true }, { dateRead: '2026-03-12T15:00:00.000Z' }],
    [
      { dateRead: '2026-03-10T00:00:00Z' },
      { isRead: true },
      { dateRead: '2026-03-10T00:00:00Z' },
    ],
    [{ dateRead: '2026-03-10T00:00:00Z' }, { isRead: false }, {}],
    [
      { dateRead: '2026-03-10T00:00:00Z' },
      { isArchived: true },
      { dateRead: '2026-03-10T00:00:00Z', isArchived: true },
    ],
  ])('applies %p with %p', (fields, update, expected) => {
    expect(applyUpdate(article(fields), update, now)).toEqual(
      article(expected)
    );
  });
});

describe('mapPages', () => {
  test.each([
    {
      data: {
        pages: [
          { articles: articles.slice(0, 2), nextCursor: 'foo' },
          { articles: articles.slice(2), nextCursor: null },
        ],
        pageParams: [null, 'foo'],
      },
      expected: {
        pages: [
          { articles: [articles[0]], nextCursor: 'foo' },
          { articles: [articles[2]], nextCursor: null },
        ],
        pageParams: [null, 'foo'],
      },
    },
    { data: undefined, expected: undefined },
  ])('removes articles from every page of $data', ({ data, expected }) => {
    expect(mapPages(data, (articles) => removeArticle(articles, 'b'))).toEqual(
      expected
    );
  });
});

describe('prependArticle', () => {
  test.each([
    {
      data: {
        pages: [
          { articles: [articles[0]], nextCursor: 'foo' },
          { articles: [articles[1]], nextCursor: null },
        ],
        pageParams: [null, 'foo'],
      },
      expected: {
        pages: [
          { articles: [articles[2], articles[0]], nextCursor: 'foo' },
          { articles: [articles[1]], nextCursor: null },
        ],
        pageParams: [null, 'foo'],
      },
    },
    { data: undefined, expected: undefined },
  ])('prepends to the first page of $data', ({ data, expected }) => {
    expect(prependArticle(data, articles[2])).toEqual(expected);
  });
});

describe('removeArticle', () => {
  test('removes only the matching article', () => {
    expect(removeArticle(articles, 'b')).toEqual([articles[0], articles[2]]);
  });
});

describe('pendingArticle', () => {
  test('creates an empty pending article', () => {
    expect(
      pendingArticle('foo', 'https://foo.com/', '2026-03-12T00:00:00Z')
    ).toEqual(article({ status: 'pending' }));
  });
});

describe('replaceArticle', () => {
  test.each<[Article, Article[]]>([
    [
      { ...articles[1], articleId: 'd' },
      [articles[0], { ...articles[1], articleId: 'd' }, articles[2]],
    ],
    [articles[2], [articles[0], articles[2]]],
  ])(
    'replaces the matching article and drops duplicates %#',
    (article, expected) => {
      expect(replaceArticle(articles, 'b', article)).toEqual(expected);
    }
  );
});

describe('pollInterval', () => {
  test.each<[Article[], number | false]>([
    [[], false],
    [articles, false],
    [[article({ status: 'failed' })], false],
    [[...articles, article({ status: 'pending' })], POLL_INTERVAL],
  ])('polls while any article is pending %#', (articles, expected) => {
    expect(pollInterval(articles)).toEqual(expected);
  });
});
