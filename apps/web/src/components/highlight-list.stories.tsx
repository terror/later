import { fn } from 'storybook/test';

import { highlights } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { HighlightList } from './highlight-list';

const meta = preview.meta({
  component: HighlightList,
  args: { highlights, onSelect: fn() },
  decorators: [
    (Story) => (
      <div className='w-[340px] bg-card p-6'>
        <Story />
      </div>
    ),
  ],
  title: 'Patterns/HighlightList',
});

export const Default = meta.story({});

export const Empty = meta.story({ args: { highlights: [] } });
