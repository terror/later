import { createHighlight, deleteHighlight, updateHighlight } from '@/lib/api';
import {
  DEFAULT_HIGHLIGHT_COLOR,
  insertHighlight,
  patchHighlight,
  removeHighlight,
} from '@/lib/highlights';
import { highlightsQuery } from '@/lib/queries';
import type { CreateHighlight, Highlight, UpdateHighlight } from '@later/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useHighlightMutation<T, R>(
  articleId: string,
  mutationFn: (variables: T) => Promise<R>,
  optimistic: (highlights: Highlight[], variables: T) => Highlight[]
) {
  const queryClient = useQueryClient();

  const { queryKey } = highlightsQuery(articleId);

  return useMutation({
    mutationFn,
    onMutate: async (variables: T) => {
      await queryClient.cancelQueries({ queryKey });

      const highlights = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(
        queryKey,
        (highlights) => highlights && optimistic(highlights, variables)
      );

      return { highlights };
    },
    onError: (error, _variables, context) => {
      console.error(error);
      queryClient.setQueryData(queryKey, context?.highlights);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useCreateHighlight(articleId: string) {
  return useHighlightMutation(
    articleId,
    (range: CreateHighlight) => createHighlight(articleId, range),
    (highlights, range) => {
      const now = new Date().toISOString();

      return insertHighlight(highlights, {
        ...range,
        highlight_id: `pending-${crypto.randomUUID()}`,
        article_id: articleId,
        context_before: null,
        context_after: null,
        color: DEFAULT_HIGHLIGHT_COLOR,
        note: null,
        created_at: now,
        updated_at: now,
      });
    }
  );
}

export function useUpdateHighlight(articleId: string) {
  return useHighlightMutation(
    articleId,
    ({
      highlightId,
      update,
    }: {
      highlightId: string;
      update: UpdateHighlight;
    }) => updateHighlight(articleId, highlightId, update),
    (highlights, { highlightId, update }) =>
      patchHighlight(highlights, highlightId, update)
  );
}

export function useDeleteHighlight(articleId: string) {
  return useHighlightMutation(
    articleId,
    (highlightId: string) => deleteHighlight(articleId, highlightId),
    removeHighlight
  );
}
