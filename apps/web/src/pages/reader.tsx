import { ReaderView } from '@/components/reader-view';
import {
  useDeleteArticle,
  useSaveProgress,
  useUpdateArticle,
} from '@/hooks/use-article-mutations';
import { useAuth } from '@/hooks/use-auth';
import { articleQuery } from '@/lib/queries';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
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

  const saveProgress = useSaveProgress();

  const counted = useRef(0);

  useEffect(() => {
    counted.current = Date.now();
  }, [articleId]);

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
      onToggleRead={() =>
        article &&
        update.mutate({
          articleId,
          update: { is_read: article.date_read === null },
        })
      }
      onProgress={(scroll_position) => {
        if (!article) {
          return;
        }

        const seconds = Math.floor((Date.now() - counted.current) / 1000);

        counted.current += seconds * 1000;

        saveProgress.mutate({
          articleId,
          progress: {
            scroll_position,
            time_spent_seconds: article.progress.time_spent_seconds + seconds,
          },
        });
      }}
      onDelete={() =>
        remove.mutate(articleId, { onSuccess: () => navigate('/') })
      }
    />
  );
}
