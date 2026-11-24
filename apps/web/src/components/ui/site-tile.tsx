import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'size-8 rounded-lg text-[13px]',
  md: 'size-9 rounded-[9px] text-[15px]',
  lg: 'size-11 rounded-xl text-lg',
};

export function SiteTile({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = name.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? '·';

  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center bg-muted font-semibold text-muted-foreground',
        SIZES[size],
        className
      )}
    >
      {initial}
    </span>
  );
}
