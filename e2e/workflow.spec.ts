import { test, expect as baseExpect, type Page } from '@playwright/test';

const expect = baseExpect.configure({ timeout: 15000 });

export async function runWorkflow(page: Page) {
  const id = Date.now().toString();
  const registration = `HK-${id.slice(-8)}`;
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  // External basemap tiles are not part of the API integration contract.
  await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  console.log('Browser: auth screen loaded');
  await page.getByRole('button', { name: '¿Primera vez? Crear cuenta' }).click();
  await page.getByLabel('Correo electrónico').fill(`pilot-${id}@example.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('IntegrationPass123!');
  await page.getByRole('button', { name: /^Crear cuenta/ }).click();
  await expect(page.getByRole('heading', { name: 'Vista general' })).toBeVisible();
  console.log('Browser: registered and logged in');
  await page.getByRole('link', { name: /Aeronaves/, exact: false }).first().click();
  await page.getByLabel('Matrícula').fill(registration);
  await page.getByLabel('Modelo', { exact: true }).fill('Cessna 172');
  await page.getByRole('button', { name: 'Crear aeronave', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Aeronave guardada.');
  console.log('Browser: aircraft created');

  await page.getByRole('link', { name: /Planes de ruta/ }).click();
  await page.getByLabel('Nombre de la ruta').fill(`Ruta integración ${id}`);
  await page.getByLabel('Aeronave asignada').selectOption({ label: `${registration} · Cessna 172` });
  await page.getByRole('spinbutton', { name: 'Latitud waypoint 1', exact: true }).fill('4.7016');
  await page.getByRole('spinbutton', { name: 'Longitud waypoint 1', exact: true }).fill('-74.1469');
  await page.getByRole('spinbutton', { name: 'Latitud waypoint 2', exact: true }).fill('6.1645');
  await page.getByRole('spinbutton', { name: 'Longitud waypoint 2', exact: true }).fill('-75.4231');
  await page.getByRole('button', { name: 'Crear ruta', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Plan de ruta guardado.');
  console.log('Browser: route created');
  await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
  await page.getByRole('spinbutton', { name: 'Altitud waypoint 2', exact: true }).fill('1500');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Plan de ruta guardado.');

  await page.getByRole('link', { name: /Simulador/ }).click();
  await page.getByRole('checkbox', { name: new RegExp(`Ruta integración ${id}`) }).check();
  await page.getByRole('button', { name: 'Cargar escenario', exact: true }).click();
  await expect(page.locator('.telemetry-row')).toContainText(registration);
  await expect(page.locator('.plane-marker')).toHaveCount(1);
  await page.getByRole('slider', { name: 'Tiempo simulado en segundos' }).evaluate(element => {
    (element as HTMLInputElement).value = '60';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.clock')).toContainText('60');
  await page.getByRole('button', { name: /Reproducir/ }).click();
  await page.waitForFunction(() => Number((document.querySelector('.timeline') as HTMLInputElement)?.value) >= 120);
  await page.getByRole('button', { name: /Pausar/ }).click();
  await page.screenshot({ path: 'test-results/simulation.png', fullPage: true });
  expect(failures).toEqual([]);
  console.log('Browser: map, seek and playback verified');
}

if (!process.env['E2E_STANDALONE']) {
  test('registers, creates a flight plan and renders calculated aircraft positions', async ({ page }) => runWorkflow(page));
}
