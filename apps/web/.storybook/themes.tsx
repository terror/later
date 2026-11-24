import type { Decorator } from '@storybook/react-vite';

export const themes: Decorator = (Story) => (
  <div className='grid grid-cols-2'>
    <div className='bg-background p-8 text-foreground'>
      <Story />
    </div>
    <div className='dark bg-background p-8 text-foreground'>
      <Story />
    </div>
  </div>
);
