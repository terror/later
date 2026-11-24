import { cn } from '@/lib/utils';
import type { ArticleStatus as Status } from '@later/types';
import { CircleAlert, LoaderCircle } from 'lucide-react';

export function ArticleStatus({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  if (status === 'extracted') {
    return null;
  }

  const Icon = status === 'pending' ? LoaderCircle : CircleAlert;

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Icon
        aria-hidden
        className={cn(
          'size-3.5 shrink-0',
          status === 'pending' && 'animate-spin'
        )}
      />
      {status === 'pending' ? 'Fetching page…' : 'Couldn’t fetch page'}
    </span>
  );
}
