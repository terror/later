import { fn } from 'storybook/test';

import { reading } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { ReaderView } from './reader-view';

const meta = preview.meta({
  component: ReaderView,
  args: {
    article: reading,
    onToggleFavorite: fn(),
    onToggleArchive: fn(),
    onDelete: fn(),
  },
  parameters: { layout: 'fullscreen' },
  title: 'Patterns/Reader',
});

export const Default = meta.story({
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const WithoutText = meta.story({
  args: { article: { ...reading, content: null } },
});

export const Error = meta.story({ args: { article: null, error: true } });
