import preview from '../../.storybook/preview';
import PrivacyPage from './privacy';

const meta = preview.meta({
  component: PrivacyPage,
  parameters: { layout: 'fullscreen' },
  title: 'Patterns/Privacy',
});

export const Default = meta.story({});
