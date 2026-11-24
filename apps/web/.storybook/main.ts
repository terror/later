import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
});
