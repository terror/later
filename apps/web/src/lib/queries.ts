import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getArticle, getArticles, getHighlights, getSession } from './api';

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: getSession,
  staleTime: 5 * 60 * 1000,
});

export const articlesQuery = infiniteQueryOptions({
  queryKey: ['articles'],
  queryFn: ({ pageParam }) => getArticles({ cursor: pageParam ?? undefined }),
  initialPageParam: null as string | null,
  getNextPageParam: (page) => page.next_cursor,
});

export function articleQuery(articleId: string) {
  return queryOptions({
    queryKey: ['articles', articleId],
    queryFn: () => getArticle(articleId),
  });
}

export function highlightsQuery(articleId: string) {
  return queryOptions({
    queryKey: ['articles', articleId, 'highlights'],
    queryFn: () => getHighlights(articleId),
  });
}
