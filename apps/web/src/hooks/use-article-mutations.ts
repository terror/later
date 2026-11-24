import { deleteArticle, updateArticle } from '@/lib/api';
import { type ArticleUpdate, patchArticle, removeArticle } from '@/lib/library';
import { articleQuery, articlesQuery } from '@/lib/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      articleId,
      update,
    }: {
      articleId: string;
      update: ArticleUpdate;
    }) => updateArticle(articleId, update),
    onMutate: async ({ articleId, update }) => {
      await queryClient.cancelQueries({ queryKey: articlesQuery.queryKey });

      const articles = queryClient.getQueryData(articlesQuery.queryKey);

      const article = queryClient.getQueryData(
        articleQuery(articleId).queryKey
      );

      queryClient.setQueryData(
        articlesQuery.queryKey,
        (articles) => articles && patchArticle(articles, articleId, update)
      );

      queryClient.setQueryData(
        articleQuery(articleId).queryKey,
        (article) => article && { ...article, ...update }
      );

      return { articles, article };
    },
    onError: (error, { articleId }, context) => {
      console.error(error);
      queryClient.setQueryData(articlesQuery.queryKey, context?.articles);
      queryClient.setQueryData(
        articleQuery(articleId).queryKey,
        context?.article
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: articlesQuery.queryKey }),
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArticle,
    onMutate: async (articleId: string) => {
      await queryClient.cancelQueries({ queryKey: articlesQuery.queryKey });

      const articles = queryClient.getQueryData(articlesQuery.queryKey);

      queryClient.setQueryData(
        articlesQuery.queryKey,
        (articles) => articles && removeArticle(articles, articleId)
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
