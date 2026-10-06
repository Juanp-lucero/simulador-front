const { chromium } = require('@playwright/test');

if (process.env.E2E_ALLOW_DATA_CREATION !== '1') {
  throw new Error('Esta prueba crea una cuenta, aeronave y ruta. Usa una base desechable y define E2E_ALLOW_DATA_CREATION=1.');
}
process.env.E2E_STANDALONE = '1';
const { runWorkflow } = require('./workflow.spec.ts');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    env: process.env.PLAYWRIGHT_BROWSER_LIBS
      ? { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_BROWSER_LIBS }
      : undefined,
    headless: true,
    args: process.env.PLAYWRIGHT_LOW_MEMORY === '1'
      ? ['--no-zygote', '--single-process', '--disable-gpu']
      : undefined,
  });
  console.log('Browser launched');
  try {
    const page = await browser.newPage({ baseURL: process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:4200' });
    page.setDefaultTimeout(20000);
    await runWorkflow(page);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
