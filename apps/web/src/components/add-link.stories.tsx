import { fn } from 'storybook/test';

import preview from '../../.storybook/preview';
import { AddLink } from './add-link';

const meta = preview.meta({
  component: AddLink,
  args: { onAdd: fn() },
  title: 'Patterns/AddLink',
});

export const Default = meta.story({});

export const Open = meta.story({ args: { defaultOpen: true } });
