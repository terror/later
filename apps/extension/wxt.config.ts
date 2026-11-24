import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

const gecko = {
  id: 'later@later.sh',
  strict_min_version: '140.0',
  data_collection_permissions: {
    required: ['browsingActivity', 'websiteContent'],
  },
};

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    name: 'later',
    description:
      'Save the page you’re on to later, and read it when you’re ready.',
    homepage_url: 'https://www.later.sh',
    permissions: ['activeTab', 'identity', 'scripting', 'storage'],
    host_permissions: ['https://api.later.sh/*'],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko,
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
  }),
  zip: {
    sourcesRoot: '../..',
    excludeSources: [
      'apps/extension/.output/**',
      'apps/extension/.wxt/**',
      'apps/extension/store/**',
      'apps/web/**',
      'bin/**',
      'docs/**',
      'packages/**',
      'target/**',
      'Cargo.*',
      'docker-compose.yml',
      'justfile',
      'rust-toolchain.toml',
      'rustfmt.toml',
    ],
    includeSources: ['apps/web/package.json'],
  },
});
