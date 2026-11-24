import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'later',
    description: 'Save pages to later.',
    permissions: ['activeTab', 'identity', 'scripting', 'storage'],
    host_permissions: ['https://api.later.sh/*'],
  },
});
