import { ArticleStatus } from '@/components/article-status';
import { Progress } from '@/components/ui/progress';
import { SiteTile } from '@/components/ui/site-tile';
import { formatSaved } from '@/lib/format';
import { readingStatus } from '@/lib/reading';
import { articleSource, cn } from '@/lib/utils';
import type { Article } from '@later/types';
import { Link } from 'react-router-dom';

export function ArticleRow({
  article,
  active = false,
  now,
  onActivate,
}: {
  article: Article;
  active?: boolean;
  now: Date;
  onActivate?: () => void;
}) {
  const source = articleSource(article);

  const read = article.dateRead !== null;

  const meta = [
    source,
    article.author,
    article.readingTimeMinutes === null
      ? null
      : `${article.readingTimeMinutes} min`,
    read ? 'Read' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/read/${article.articleId}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      className={cn(
        'flex gap-3.5 rounded-xl px-3 py-3.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/15 md:px-4',
        active ? 'bg-muted' : 'hover:bg-card'
      )}
    >
      <SiteTile name={source} className={cn(active && 'bg-background')} />
      <span className='flex min-w-0 flex-1 flex-col gap-1'>
        <span className='flex items-baseline gap-3'>
          <span
            className={cn(
              'line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-medium tracking-[-0.012em] md:line-clamp-1',
              read && 'text-muted-foreground'
            )}
          >
            {article.title ?? article.url}
          </span>
          <span className='shrink-0 text-xs text-muted-foreground'>
            {formatSaved(article.dateSaved, now)}
          </span>
        </span>
        <span className='flex items-center gap-3'>
          <span className='flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground'>
            <span className='truncate'>{meta}</span>
            {article.status !== 'extracted' && (
              <>
                <span aria-hidden>·</span>
                <ArticleStatus status={article.status} className='shrink-0' />
              </>
            )}
          </span>
          {!read && article.progress.scrollPosition > 0 && (
            <Progress
              value={article.progress.scrollPosition}
              aria-label={readingStatus(article)}
              className={cn('w-12 shrink-0', active && 'bg-background')}
            />
          )}
        </span>
        {article.excerpt && (
          <span className='hidden text-[13px] leading-normal text-muted-foreground md:line-clamp-2'>
            {article.excerpt}
          </span>
        )}
      </span>
    </Link>
  );
}
