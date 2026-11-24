import { cn } from '@/lib/utils';

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 32 32'
      aria-hidden
      className={cn('size-[22px]', className)}
    >
      <rect width='32' height='32' rx='7' className='fill-primary' />
      <rect
        x='10'
        y='6'
        width='5'
        height='20'
        rx='2.5'
        className='fill-primary-foreground'
      />
      <circle cx='21' cy='23.25' r='2.75' className='fill-primary-foreground' />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <Mark />
      <span className='text-[17px] leading-none font-semibold tracking-[-0.035em]'>
        later
      </span>
    </span>
  );
}
