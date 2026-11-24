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

  const read = article.dateRead !== null;

  const timeSpent = formatTimeSpent(article.progress.timeSpentSeconds);

  const details = [
    ['Author', article.author],
    [
      'Published',
      article.publicationDate && formatDate(article.publicationDate),
    ],
    ['Saved', formatDate(article.dateSaved)],
    ['Length', formatLength(article.wordCount, article.readingTimeMinutes)],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]));

  return (
    <aside
      aria-label='Article details'
      className={cn(
        'flex w-[340px] shrink-0 flex-col gap-5 overflow-y-auto bg-card p-6',
        className
      )}
    >
      <div className='flex items-center gap-2.5'>
        <SiteTile name={source} size='sm' className='bg-background' />
        <span className='truncate text-[13px] text-muted-foreground'>
          {source}
        </span>
      </div>
      <div className='flex flex-col gap-2'>
        <h2 className='text-[19px] leading-snug font-semibold tracking-[-0.025em] text-pretty wrap-break-word'>
          {article.title ?? article.url}
        </h2>
        {article.excerpt && (
          <p className='text-[13px] leading-relaxed text-muted-foreground'>
            {article.excerpt}
          </p>
        )}
      </div>
      {article.status !== 'extracted' && (
        <p className='rounded-xl bg-background p-3.5 text-[13px] text-muted-foreground'>
          <ArticleStatus status={article.status} />
        </p>
      )}
      <dl className='flex flex-col gap-2.5 rounded-xl bg-background p-3.5 text-[13px]'>
        {details.map(([term, description]) => (
          <div key={term} className='flex justify-between gap-3'>
            <dt className='text-muted-foreground'>{term}</dt>
            <dd className='text-right'>{description}</dd>
          </div>
        ))}
      </dl>
      <div className='flex flex-col gap-3 rounded-xl bg-background p-3.5 text-[13px]'>
        <div className='flex justify-between gap-3'>
          <span>{readingStatus(article)}</span>
          {timeSpent && (
            <span className='text-muted-foreground'>{timeSpent}</span>
          )}
        </div>
        <Progress
          value={read ? 1 : article.progress.scrollPosition}
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
            <Link to={`/read/${article.articleId}`}>
              <BookOpen />
              Read
            </Link>
          </Button>
        )}
        <Button
          variant='secondary'
          size='icon'
          aria-label={article.isFavorited ? 'Unfavorite' : 'Favorite'}
          aria-pressed={article.isFavorited}
          title={article.isFavorited ? 'Unfavorite' : 'Favorite'}
          onClick={onToggleFavorite}
        >
          <Star className={cn(article.isFavorited && 'fill-current')} />
        </Button>
        <Button
          variant='secondary'
          size='icon'
          aria-label={article.isArchived ? 'Unarchive' : 'Archive'}
          title={article.isArchived ? 'Unarchive' : 'Archive'}
          onClick={onToggleArchive}
        >
          {article.isArchived ? <ArchiveRestore /> : <Archive />}
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
