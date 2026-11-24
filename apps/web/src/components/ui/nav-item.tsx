import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

export function NavItem({
  icon: Icon,
  label,
  count,
  active = false,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  icon: LucideIcon;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <button
      type='button'
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-[34px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors',
        active
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        className
      )}
      {...props}
    >
      <Icon className='size-4 shrink-0' aria-hidden />
      <span className='flex-1 truncate'>{label}</span>
      {count !== undefined && (
        <span className='text-xs text-muted-foreground tabular-nums'>
          {count}
        </span>
      )}
    </button>
  );
}
