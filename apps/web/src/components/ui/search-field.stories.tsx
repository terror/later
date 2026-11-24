import preview from '../../../.storybook/preview';
import { themes } from '../../../.storybook/themes';
import { SearchField } from './search-field';

const meta = preview.meta({
  component: SearchField,
  args: { placeholder: 'Search', 'aria-label': 'Search', shortcut: '/' },
  decorators: [themes],
  title: 'Components/SearchField',
});

export const Default = meta.story({
  render: (args) => <SearchField {...args} className='w-64' />,
});
