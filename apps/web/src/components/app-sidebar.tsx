import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { NavItem } from '@/components/ui/nav-item';
import { VIEWS, type View } from '@/lib/library';
import { cn } from '@/lib/utils';
import type { User } from '@later/types';
import { Archive, Inbox, LogOut, Star } from 'lucide-react';

const ICONS = { inbox: Inbox, favorites: Star, archive: Archive };

function initials(user: User): string {
  return (user.name ?? user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function AppSidebar({
  view,
  counts,
  onViewChange,
  user,
  signOutHref,
  className,
}: {
  view: View;
  counts: Record<View, number>;
  onViewChange: (view: View) => void;
  user: User | null;
  signOutHref: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'bg-sidebar flex w-62 shrink-0 flex-col gap-5 px-3 py-3.5',
        className
      )}
    >
      <div className='flex h-8 items-center px-1.5'>
        <Logo />
      </div>
      <nav aria-label='Library' className='flex flex-col gap-0.5'>
        {VIEWS.map((option) => (
          <NavItem
            key={option.value}
            icon={ICONS[option.value]}
            label={option.label}
            count={counts[option.value]}
            active={view === option.value}
            onClick={() => onViewChange(option.value)}
          />
        ))}
      </nav>
      <div className='flex-1' />
      {user && (
        <div className='flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5'>
          <span
            aria-hidden
            className='bg-muted flex size-[30px] shrink-0 items-center justify-center rounded-full text-xs font-semibold'
          >
            {initials(user)}
          </span>
          <span className='flex min-w-0 flex-1 flex-col'>
            <span className='truncate text-[13px] font-medium'>
              {user.name ?? user.email}
            </span>
            {user.name && (
              <span className='text-muted-foreground truncate text-xs'>
                {user.email}
              </span>
            )}
          </span>
          <Button asChild variant='ghost' size='icon-sm'>
            <a href={signOutHref} aria-label='Sign out' title='Sign out'>
              <LogOut />
            </a>
          </Button>
        </div>
      )}
    </aside>
  );
}
