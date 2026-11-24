import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import addonThemes, { withThemeByClassName } from '@storybook/addon-themes';
import { definePreview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';

import '../src/index.css';

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonThemes()],
  decorators: [
    withThemeByClassName({
      defaultTheme: 'light',
      themes: { dark: 'dark', light: 'light' },
    }),
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
    options: {
      storySort: {
        order: [
          'Foundations',
          ['Color', 'Typography', 'Shape'],
          'Components',
          'Patterns',
        ],
      },
    },
    viewport: {
      options: {
        phone: {
          name: 'Phone',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        laptop: {
          name: 'Laptop',
          styles: { width: '1440px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },
});
