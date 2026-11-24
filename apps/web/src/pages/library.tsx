import { Library } from '@/components/library';
import {
  useDeleteArticle,
  useSaveArticle,
  useUpdateArticle,
} from '@/hooks/use-article-mutations';
import { useAuth } from '@/hooks/use-auth';
import { getLogoutUrl } from '@/lib/api';
import { articlesQuery } from '@/lib/queries';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function LibraryPage() {
  const { user } = useAuth();

  const { data, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery(articlesQuery);

  const update = useUpdateArticle();

  const remove = useDeleteArticle();

  const save = useSaveArticle();

  const [now] = useState(() => new Date());

  return (
    <Library
      articles={data?.pages.flatMap((page) => page.articles) ?? null}
      error={isError}
      hasMore={hasNextPage}
      loadingMore={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      user={user}
      signOutHref={getLogoutUrl()}
      now={now}
      onToggleFavorite={(article) =>
        update.mutate({
          articleId: article.article_id,
          update: { is_favorited: !article.is_favorited },
        })
      }
      onToggleArchive={(article) =>
        update.mutate({
          articleId: article.article_id,
          update: { is_archived: !article.is_archived },
        })
      }
      onToggleRead={(article) =>
        update.mutate({
          articleId: article.article_id,
          update: { is_read: article.date_read === null },
        })
      }
      onDelete={(article) => remove.mutate(article.article_id)}
      onAddLink={(url) => save.mutate(url)}
    />
  );
}
