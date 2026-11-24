import preview from '../../.storybook/preview';

const SCALE = [
  [
    'Display',
    'text-[40px] leading-[1.1] font-semibold tracking-[-0.04em]',
    'The case for reading slowly',
  ],
  ['Title', 'text-[22px] font-semibold tracking-[-0.03em]', 'Inbox'],
  [
    'Heading',
    'text-[19px] font-semibold tracking-[-0.025em]',
    'How small teams ship large systems',
  ],
  [
    'Body',
    'text-[15px] font-medium tracking-[-0.012em]',
    'A field guide to plain text',
  ],
  ['Text', 'text-sm', 'Save pages with the later browser extension.'],
  [
    'Meta',
    'text-[13px] text-muted-foreground',
    'Field Notes · Mara Ellison · 12 min',
  ],
  ['Reading', 'reader-content', 'Reading slowly is not about reading less.'],
];

function Scale() {
  return (
    <div className='flex w-[720px] flex-col gap-5'>
      {SCALE.map(([name, className, sample]) => (
        <div key={name} className='flex items-baseline gap-6'>
          <span className='w-20 shrink-0 text-xs text-muted-foreground'>
            {name}
          </span>
          <span className={className}>{sample}</span>
        </div>
      ))}
    </div>
  );
}

const meta = preview.meta({
  component: Scale,
  title: 'Foundations/Typography',
});

export const TypeScale = meta.story({});
