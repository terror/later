import { Archive, Inbox, Star } from 'lucide-react';

import preview from '../../../.storybook/preview';
import { themes } from '../../../.storybook/themes';
import { NavItem } from './nav-item';

const meta = preview.meta({
  component: NavItem,
  args: { icon: Inbox, label: 'Inbox', count: 24 },
  decorators: [themes],
  title: 'Components/NavItem',
});

export const States = meta.story({
  render: () => (
    <div className='bg-sidebar flex w-56 flex-col gap-0.5 rounded-xl p-3'>
      <NavItem icon={Inbox} label='Inbox' count={24} active />
      <NavItem icon={Star} label='Favorites' count={6} />
      <NavItem icon={Archive} label='Archive' count={112} />
    </div>
  ),
});
