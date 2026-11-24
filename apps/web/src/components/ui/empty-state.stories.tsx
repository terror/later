import preview from '../../../.storybook/preview';
import { EmptyState } from './empty-state';

const meta = preview.meta({
  component: EmptyState,
  args: {
    title: 'Nothing to read yet.',
    description: 'Save pages with the later browser extension.',
  },
  title: 'Components/EmptyState',
});

export const Default = meta.story({});
