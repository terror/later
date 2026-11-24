import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `bunx vite build && bunx vite preview --port ${PORT} --strictPort`,
    env: { VITE_API_URL: '' },
    reuseExistingServer: !process.env.CI,
    url: `http://localhost:${PORT}`,
  },
});
