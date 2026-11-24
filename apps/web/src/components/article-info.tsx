import { ArticleStatus } from '@/components/article-status';
import { HighlightList } from '@/components/highlight-list';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SiteTile } from '@/components/ui/site-tile';
import { formatDate, formatLength, formatTimeSpent } from '@/lib/format';
import { readingStatus } from '@/lib/reading';
import { articleSource, cn } from '@/lib/utils';
import type { Article, Highlight } from '@later/types';
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  Circle,
  CircleCheck,
  ExternalLink,
  Star,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function ArticleInfo({
  article,
  onToggleFavorite,
  onToggleArchive,
  onToggleRead,
  onDelete,
  showRead = true,
  highlights,
  onSelectHighlight,
  className,
}: {
  article: Article;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
  showRead?: boolean;
  highlights?: Highlight[];
  onSelectHighlight?: (highlight: Highlight) => void;
  className?: string;
}) {
  const source = articleSource(article);

  const read = article.date_read !== null;

  const timeSpent = formatTimeSpent(article.progress.time_spent_seconds);

  const details = [
    ['Author', article.author],
    [
      'Published',
      article.publication_date && formatDate(article.publication_date),
    ],
    ['Saved', formatDate(article.date_saved)],
    ['Length', formatLength(article.word_count, article.reading_time_minutes)],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]));

  return (
    <aside
      aria-label='Article details'
      className={cn(
        'bg-card flex w-[340px] shrink-0 flex-col gap-5 overflow-y-auto p-6',
        className
      )}
    >
      <div className='flex items-center gap-2.5'>
        <SiteTile name={source} size='sm' className='bg-background' />
        <span className='text-muted-foreground truncate text-[13px]'>
          {source}
        </span>
      </div>
      <div className='flex flex-col gap-2'>
        <h2 className='text-[19px] leading-snug font-semibold tracking-[-0.025em] text-pretty wrap-break-word'>
          {article.title ?? article.url}
        </h2>
        {article.excerpt && (
          <p className='text-muted-foreground text-[13px] leading-relaxed'>
            {article.excerpt}
          </p>
        )}
      </div>
      {article.status !== 'extracted' && (
        <p className='bg-background text-muted-foreground rounded-xl p-3.5 text-[13px]'>
          <ArticleStatus status={article.status} />
        </p>
      )}
      <dl className='bg-background flex flex-col gap-2.5 rounded-xl p-3.5 text-[13px]'>
        {details.map(([term, description]) => (
          <div key={term} className='flex justify-between gap-3'>
            <dt className='text-muted-foreground'>{term}</dt>
            <dd className='text-right'>{description}</dd>
          </div>
        ))}
      </dl>
      <div className='bg-background flex flex-col gap-3 rounded-xl p-3.5 text-[13px]'>
        <div className='flex justify-between gap-3'>
          <span>{readingStatus(article)}</span>
          {timeSpent && (
            <span className='text-muted-foreground'>{timeSpent}</span>
          )}
        </div>
        <Progress
          value={read ? 1 : article.progress.scroll_position}
          aria-label='Reading progress'
        />
        <Button variant='secondary' size='sm' onClick={onToggleRead}>
          {read ? <Circle /> : <CircleCheck />}
          {read ? 'Mark as unread' : 'Mark as read'}
        </Button>
      </div>
      <div className='flex gap-2'>
        {showRead && (
          <Button asChild className='flex-1'>
            <Link to={`/read/${article.article_id}`}>
              <BookOpen />
              Read
            </Link>
          </Button>
        )}
        <Button
          variant='secondary'
          size='icon'
          aria-label={article.is_favorited ? 'Unfavorite' : 'Favorite'}
          aria-pressed={article.is_favorited}
          title={article.is_favorited ? 'Unfavorite' : 'Favorite'}
          onClick={onToggleFavorite}
        >
          <Star className={cn(article.is_favorited && 'fill-current')} />
        </Button>
        <Button
          variant='secondary'
          size='icon'
          aria-label={article.is_archived ? 'Unarchive' : 'Archive'}
          title={article.is_archived ? 'Unarchive' : 'Archive'}
          onClick={onToggleArchive}
        >
          {article.is_archived ? <ArchiveRestore /> : <Archive />}
        </Button>
        <Button asChild variant='secondary' size='icon'>
          <a
            href={article.url}
            target='_blank'
            rel='noreferrer'
            aria-label='Open original'
            title='Open original'
          >
            <ExternalLink />
          </a>
        </Button>
        <Button
          variant='secondary'
          size='icon'
          aria-label='Delete'
          title='Delete'
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
      {highlights && (
        <HighlightList
          highlights={highlights}
          onSelect={(highlight) => onSelectHighlight?.(highlight)}
        />
      )}
    </aside>
  );
}
