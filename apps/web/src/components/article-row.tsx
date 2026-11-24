import { SiteTile } from '@/components/ui/site-tile';
import { formatSaved } from '@/lib/format';
import type { Article } from '@/lib/types';
import { articleSource, cn } from '@/lib/utils';
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

  const meta = [
    source,
    article.author,
    article.reading_time_minutes === null
      ? null
      : `${article.reading_time_minutes} min`,
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
          <span className='line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-medium tracking-[-0.012em] md:line-clamp-1'>
            {article.title ?? article.url}
          </span>
          <span className='text-muted-foreground shrink-0 text-xs'>
            {formatSaved(article.date_saved, now)}
          </span>
        </span>
        <span className='text-muted-foreground truncate text-[13px]'>
          {meta}
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
