import { cn } from '@/lib/utils';
import * as React from 'react';

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'bg-background text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1.5 font-sans text-xs',
        className
      )}
      {...props}
    />
  );
}
