import { fn } from 'storybook/test';

import { user } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { AppSidebar } from './app-sidebar';

const meta = preview.meta({
  component: AppSidebar,
  args: {
    view: 'inbox' as const,
    counts: { inbox: 24, favorites: 6, archive: 112 },
    onViewChange: fn(),
    user,
    signOutHref: '#',
    className: 'h-[640px]',
  },
  title: 'Patterns/AppSidebar',
});

export const Default = meta.story({});
