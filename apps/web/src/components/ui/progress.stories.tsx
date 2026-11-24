import preview from '../../../.storybook/preview';
import { themes } from '../../../.storybook/themes';
import { Progress } from './progress';

const meta = preview.meta({
  component: Progress,
  args: { value: 0.42, 'aria-label': 'Reading progress' },
  decorators: [themes],
  title: 'Components/Progress',
});

export const Values = meta.story({
  render: (args) => (
    <div className='flex w-48 flex-col gap-4'>
      <Progress {...args} value={0} />
      <Progress {...args} />
      <Progress {...args} value={1} />
    </div>
  ),
});
