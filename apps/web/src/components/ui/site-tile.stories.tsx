import preview from '../../../.storybook/preview';
import { themes } from '../../../.storybook/themes';
import { SiteTile } from './site-tile';

const meta = preview.meta({
  component: SiteTile,
  args: { name: 'Field Notes' },
  decorators: [themes],
  title: 'Components/SiteTile',
});

export const Sizes = meta.story({
  render: (args) => (
    <div className='flex items-end gap-3'>
      <SiteTile {...args} size='sm' />
      <SiteTile {...args} size='md' />
      <SiteTile {...args} size='lg' />
    </div>
  ),
});
