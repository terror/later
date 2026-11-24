import { providers } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import LandingPage from './landing';

const meta = preview.meta({
  component: LandingPage,
  args: { providers },
  parameters: { layout: 'fullscreen' },
  title: 'Patterns/Landing',
});

export const Default = meta.story({});

export const GitHubOnly = meta.story({ args: { providers: ['github'] } });
