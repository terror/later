import { Archive, BookOpen } from 'lucide-react';

import preview from '../../../.storybook/preview';
import { themes } from '../../../.storybook/themes';
import { Button } from './button';

const meta = preview.meta({
  component: Button,
  args: { children: 'Button' },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm'],
    },
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'ghost', 'destructive', 'link'],
    },
  },
  tags: ['autodocs'],
  title: 'Components/Button',
});

export const Default = meta.story({});

export const Variants = meta.story({
  decorators: [themes],
  render: (args) => (
    <div className='flex flex-wrap items-center gap-2'>
      <Button {...args}>
        <BookOpen />
        Read
      </Button>
      <Button {...args} variant='secondary'>
        Secondary
      </Button>
      <Button {...args} variant='ghost'>
        Ghost
      </Button>
      <Button {...args} variant='destructive'>
        Delete
      </Button>
      <Button {...args} variant='secondary' size='icon' aria-label='Archive'>
        <Archive />
      </Button>
    </div>
  ),
});

export const Sizes = meta.story({
  render: (args) => (
    <div className='flex items-center gap-2'>
      <Button {...args} size='sm'>
        Small
      </Button>
      <Button {...args}>Default</Button>
      <Button {...args} size='lg'>
        Large
      </Button>
    </div>
  ),
});
