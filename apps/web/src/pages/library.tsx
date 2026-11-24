import { Library } from '@/components/library';
import {
  useDeleteArticle,
  useUpdateArticle,
} from '@/hooks/use-article-mutations';
import { useAuth } from '@/hooks/use-auth';
import { getLogoutUrl } from '@/lib/api';
import { articlesQuery } from '@/lib/queries';
import { useQuery } from '@tanstack/react-query';

export default function LibraryPage() {
  const { user } = useAuth();

  const { data: articles, isError } = useQuery(articlesQuery);

  const update = useUpdateArticle();

  const remove = useDeleteArticle();

  return (
    <Library
      articles={articles ?? null}
      error={isError}
      user={user}
      signOutHref={getLogoutUrl()}
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
      onDelete={(article) => remove.mutate(article.article_id)}
    />
  );
}
