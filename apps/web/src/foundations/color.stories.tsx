import preview from '../../.storybook/preview';
import { themes } from '../../.storybook/themes';

const TOKENS = [
  ['Background', '--background', 'Page and reading surface'],
  ['Card', '--card', 'Sidebar, panels and fields'],
  ['Muted', '--muted', 'Selected rows, secondary buttons and tiles'],
  ['Foreground', '--foreground', 'Text and icons'],
  ['Muted foreground', '--muted-foreground', 'Secondary text'],
  ['Faint', '--faint', 'Decoration only'],
  ['Primary', '--primary', 'The one primary action'],
  ['Destructive', '--destructive', 'Irreversible actions'],
  ['Reading', '--reading', 'Article body text'],
];

function Swatches() {
  return (
    <div className='grid w-[520px] grid-cols-[48px_1fr] items-center gap-x-4 gap-y-3 text-sm'>
      {TOKENS.map(([name, token, use]) => (
        <div key={token} className='contents'>
          <span
            className='size-12 rounded-xl shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]'
            style={{ background: `var(${token})` }}
          />
          <span className='flex flex-col'>
            <span className='font-medium'>
              {name} <code className='text-muted-foreground'>{token}</code>
            </span>
            <span className='text-muted-foreground'>{use}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

const meta = preview.meta({
  component: Swatches,
  decorators: [themes],
  parameters: { layout: 'fullscreen' },
  title: 'Foundations/Color',
});

export const Palette = meta.story({});
