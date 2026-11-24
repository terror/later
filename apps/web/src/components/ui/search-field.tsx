import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import * as React from 'react';

export function SearchField({
  className,
  shortcut,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & { shortcut?: string }) {
  return (
    <label
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg bg-card px-2.5 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring/15',
        className
      )}
    >
      <Search className='size-[15px] shrink-0' aria-hidden />
      <input
        type='search'
        className='min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden'
        {...props}
      />
      {shortcut && <Kbd className='hidden md:inline-flex'>{shortcut}</Kbd>}
    </label>
  );
}
