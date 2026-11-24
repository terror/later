import { cn } from '@/lib/utils';
import * as React from 'react';

function Progress({
  value,
  className,
  ...props
}: React.ComponentProps<'div'> & { value: number }) {
  return (
    <div
      role='progressbar'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn('h-1 overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className='h-full rounded-full bg-foreground transition-[width]'
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}

export { Progress };
