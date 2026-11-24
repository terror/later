import { ReaderView } from '@/components/reader-view';
import {
  useDeleteArticle,
  useUpdateArticle,
} from '@/hooks/use-article-mutations';
import { useAuth } from '@/hooks/use-auth';
import { articleQuery } from '@/lib/queries';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ReaderPage() {
  const { user, loading } = useAuth();

  const { articleId = '' } = useParams();

  const navigate = useNavigate();

  const { data: article, isError } = useQuery({
    ...articleQuery(articleId),
    enabled: user !== null && articleId !== '',
  });

  const update = useUpdateArticle();

  const remove = useDeleteArticle();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/sign-in');
    }
  }, [user, loading, navigate]);

  return (
    <ReaderView
      article={article ?? null}
      error={isError}
      onToggleFavorite={() =>
        article &&
        update.mutate({
          articleId,
          update: { is_favorited: !article.is_favorited },
        })
      }
      onToggleArchive={() =>
        article &&
        update.mutate({
          articleId,
          update: { is_archived: !article.is_archived },
        })
      }
      onDelete={() =>
        remove.mutate(articleId, { onSuccess: () => navigate('/') })
      }
    />
  );
}
