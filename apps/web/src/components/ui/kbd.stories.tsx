import preview from '../../../.storybook/preview';
import { Kbd } from './kbd';

const meta = preview.meta({
  component: Kbd,
  args: { children: '/' },
  decorators: [
    (Story) => (
      <div className='rounded-lg bg-card p-3'>
        <Story />
      </div>
    ),
  ],
  title: 'Components/Kbd',
});

export const Default = meta.story({});
