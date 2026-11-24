import { deleteArticle, saveProgress, updateArticle } from '@/lib/api';
import {
  applyUpdate,
  mapPages,
  patchArticle,
  removeArticle,
} from '@/lib/library';
import { articleQuery, articlesQuery } from '@/lib/queries';
import type {
  Article,
  ArticlePage,
  ArticleWithContent,
  ReadingProgress,
  UpdateArticle,
} from '@later/types';
import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

type Snapshot = {
  articles: InfiniteData<ArticlePage> | undefined;
  article: ArticleWithContent | undefined;
};

async function patchCache(
  queryClient: QueryClient,
  articleId: string,
  patch: <T extends Article>(article: T) => T
): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: articlesQuery.queryKey });

  const articles = queryClient.getQueryData(articlesQuery.queryKey);

  const article = queryClient.getQueryData(articleQuery(articleId).queryKey);

  queryClient.setQueryData(articlesQuery.queryKey, (data) =>
    mapPages(data, (articles) => patchArticle(articles, articleId, patch))
  );

  queryClient.setQueryData(
    articleQuery(articleId).queryKey,
    (article) => article && patch(article)
  );

  return { articles, article };
}

function restoreCache(
  queryClient: QueryClient,
  articleId: string,
  snapshot: Snapshot | undefined
) {
  queryClient.setQueryData(articlesQuery.queryKey, snapshot?.articles);
  queryClient.setQueryData(articleQuery(articleId).queryKey, snapshot?.article);
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      articleId,
      update,
    }: {
      articleId: string;
      update: UpdateArticle;
    }) => updateArticle(articleId, update),
    onMutate: ({ articleId, update }) => {
      const now = new Date();

      return patchCache(queryClient, articleId, (article) =>
        applyUpdate(article, update, now)
      );
    },
    onError: (error, { articleId }, snapshot) => {
      console.error(error);
      restoreCache(queryClient, articleId, snapshot);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: articlesQuery.queryKey }),
  });
}

export function useSaveProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      articleId,
      progress,
    }: {
      articleId: string;
      progress: ReadingProgress;
    }) => saveProgress(articleId, progress),
    onMutate: ({ articleId, progress }) =>
      patchCache(queryClient, articleId, (article) => ({
        ...article,
        progress,
      })),
    onError: (error, { articleId }, snapshot) => {
      console.error(error);
      restoreCache(queryClient, articleId, snapshot);
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArticle,
    onMutate: async (articleId: string) => {
      await queryClient.cancelQueries({ queryKey: articlesQuery.queryKey });

      const articles = queryClient.getQueryData(articlesQuery.queryKey);

      queryClient.setQueryData(articlesQuery.queryKey, (data) =>
        mapPages(data, (articles) => removeArticle(articles, articleId))
      );

      return { articles };
    },
    onError: (error, _articleId, context) => {
      console.error(error);
      queryClient.setQueryData(articlesQuery.queryKey, context?.articles);
    },
    onSuccess: (_data, articleId) =>
      queryClient.removeQueries({ queryKey: articleQuery(articleId).queryKey }),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: articlesQuery.queryKey,
        exact: true,
      }),
  });
}
