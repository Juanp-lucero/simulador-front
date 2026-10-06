import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { API_URL } from './app/core/api.service';

async function start() {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudo cargar config.json');
  const config: { apiUrl?: string } = await response.json();
  if (!config.apiUrl || !/^https?:\/\//.test(config.apiUrl)) throw new Error('apiUrl debe ser una URL HTTP(S) absoluta');
  await bootstrapApplication(App, {
    providers: [...appConfig.providers, { provide: API_URL, useValue: config.apiUrl.replace(/\/+$/, '') }],
  });
}
start().catch(() => {
  const root = document.querySelector('app-root');
  if (root) root.textContent = 'No se pudo iniciar AeroMind. Revisa public/config.json y la conexión al servidor.';
});
