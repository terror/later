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
        'bg-card text-muted-foreground focus-within:ring-ring/15 flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm focus-within:ring-2',
        className
      )}
    >
      <Search className='size-[15px] shrink-0' aria-hidden />
      <input
        type='search'
        className='text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden'
        {...props}
      />
      {shortcut && <Kbd className='hidden md:inline-flex'>{shortcut}</Kbd>}
    </label>
  );
}
