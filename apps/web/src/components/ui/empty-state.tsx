import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 px-4 py-16 text-center', className)}
    >
      <p className='text-[17px] font-semibold tracking-[-0.02em]'>{title}</p>
      {description && (
        <p className='text-muted-foreground text-sm'>{description}</p>
      )}
    </div>
  );
}
