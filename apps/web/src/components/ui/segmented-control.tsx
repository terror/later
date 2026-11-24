import { cn } from '@/lib/utils';

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  label,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role='tablist'
      aria-label={label}
      className={cn('bg-card flex rounded-[10px] p-[3px]', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type='button'
          role='tab'
          aria-selected={option.value === value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            'h-8 flex-1 cursor-pointer rounded-lg text-[13px] font-medium transition-colors',
            option.value === value
              ? 'bg-background text-foreground dark:bg-muted shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
