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

  const read = article.date_read !== null;

  const meta = [
    source,
    article.author,
    article.reading_time_minutes === null
      ? null
      : `${article.reading_time_minutes} min`,
    read ? 'Read' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/read/${article.article_id}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      className={cn(
        'focus-visible:ring-ring/15 flex gap-3.5 rounded-xl px-3 py-3.5 transition-colors outline-none focus-visible:ring-2 md:px-4',
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
          <span className='text-muted-foreground shrink-0 text-xs'>
            {formatSaved(article.date_saved, now)}
          </span>
        </span>
        <span className='flex items-center gap-3'>
          <span className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-[13px]'>
            <span className='truncate'>{meta}</span>
            {article.status !== 'extracted' && (
              <>
                <span aria-hidden>·</span>
                <ArticleStatus status={article.status} className='shrink-0' />
              </>
            )}
          </span>
          {!read && article.progress.scroll_position > 0 && (
            <Progress
              value={article.progress.scroll_position}
              aria-label={readingStatus(article)}
              className={cn('w-12 shrink-0', active && 'bg-background')}
            />
          )}
        </span>
        {article.excerpt && (
          <span className='text-muted-foreground line-clamp-2 hidden text-[13px] leading-normal md:block'>
            {article.excerpt}
          </span>
        )}
      </span>
    </Link>
  );
}
