import { cn } from '@/lib/utils';
import * as React from 'react';

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-background px-1.5 font-sans text-xs text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
