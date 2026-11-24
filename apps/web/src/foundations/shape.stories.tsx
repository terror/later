import preview from '../../.storybook/preview';

const RADII = [
  ['Control', 'rounded-lg', 'Buttons, fields, nav items'],
  ['Row', 'rounded-xl', 'Article rows and detail lists'],
  ['Panel', 'rounded-2xl', 'Cards and feature tiles'],
  ['Band', 'rounded-3xl', 'Large callouts'],
];

function Shapes() {
  return (
    <div className='flex gap-6'>
      {RADII.map(([name, className, use]) => (
        <div key={name} className='flex w-36 flex-col gap-2 text-sm'>
          <span className={`h-20 bg-muted ${className}`} />
          <span className='font-medium'>{name}</span>
          <span className='text-[13px] text-muted-foreground'>{use}</span>
        </div>
      ))}
    </div>
  );
}

const meta = preview.meta({
  component: Shapes,
  title: 'Foundations/Shape',
});

export const Radii = meta.story({});
