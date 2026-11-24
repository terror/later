import { Highlighter } from 'lucide-react';

import preview from '../../../.storybook/preview';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta = preview.meta({
  component: Popover,
  args: { defaultOpen: true },
  title: 'Components/Popover',
});

export const Default = meta.story({
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant='secondary'>Open</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Button variant='ghost' size='sm'>
          <Highlighter />
          Highlight
        </Button>
      </PopoverContent>
    </Popover>
  ),
});
