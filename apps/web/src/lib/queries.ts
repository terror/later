import { queryOptions } from '@tanstack/react-query';

import { getArticle, getArticles, getHighlights, getSession } from './api';

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: getSession,
  staleTime: 5 * 60 * 1000,
});

export const articlesQuery = queryOptions({
  queryKey: ['articles'],
  queryFn: getArticles,
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
