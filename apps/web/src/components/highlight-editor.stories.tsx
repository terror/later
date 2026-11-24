import { fn } from 'storybook/test';

import { highlights } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { themes } from '../../.storybook/themes';
import { HighlightEditor } from './highlight-editor';

const meta = preview.meta({
  component: HighlightEditor,
  args: { highlight: highlights[1], onSave: fn(), onDelete: fn() },
  decorators: [
    (Story) => (
      <div className='rounded-xl bg-popover p-1.5 shadow-lg'>
        <Story />
      </div>
    ),
  ],
  title: 'Patterns/HighlightEditor',
});

export const Default = meta.story({});

export const WithNote = meta.story({
  args: { highlight: highlights[0] },
  decorators: [themes],
});
