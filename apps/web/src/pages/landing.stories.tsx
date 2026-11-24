import preview from '../../.storybook/preview';
import LandingPage from './landing';

const meta = preview.meta({
  component: LandingPage,
  parameters: { layout: 'fullscreen' },
  title: 'Patterns/Landing',
});

export const Default = meta.story({});
