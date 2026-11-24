import type { Decorator } from '@storybook/react-vite';

export const themes: Decorator = (Story) => (
  <div className='grid grid-cols-2'>
    <div className='bg-background text-foreground p-8'>
      <Story />
    </div>
    <div className='dark bg-background text-foreground p-8'>
      <Story />
    </div>
  </div>
);
