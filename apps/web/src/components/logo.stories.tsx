import preview from '../../.storybook/preview';
import { themes } from '../../.storybook/themes';
import { Logo, Mark } from './logo';

const meta = preview.meta({
  component: Logo,
  decorators: [themes],
  title: 'Components/Logo',
});

export const Default = meta.story({});

export const MarkOnly = meta.story({
  render: () => <Mark className='size-12' />,
});
