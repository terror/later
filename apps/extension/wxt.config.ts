import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'later',
    description: 'Save pages to later.',
    permissions: ['activeTab', 'identity', 'scripting', 'storage'],
    host_permissions: ['https://api.later.sh/*'],
  },
});
