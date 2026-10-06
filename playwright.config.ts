import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:4200', headless: true, screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] || undefined,
      env: process.env['PLAYWRIGHT_BROWSER_LIBS']
        ? { ...Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])), LD_LIBRARY_PATH: process.env['PLAYWRIGHT_BROWSER_LIBS'] }
        : undefined,
    },
  },
  webServer: {
    command: 'npm start -- --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },
});
