import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../core/api.service';
import { SimulationPage } from './simulation.page';

const BASE = 'http://api.test';
const tick = () => new Promise(resolve => setTimeout(resolve));

describe('SimulationPage AI and history', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_URL, useValue: BASE }, provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function renderWithScenario() {
    const fixture = TestBed.createComponent(SimulationPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(`${BASE}/routes?limit=100`).flush([]);
    await tick();
    http.expectOne(`${BASE}/ai/status`).flush({ provider: 'groq', configured: true, model: 'm' });
    page.sceneIds.set([3]);
    page.snapshot.set({ elapsed_s: 90, states: [] });
    page.elapsed.set(90);
    return { fixture, page };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('asks the AI about the scenario at the current instant', async () => {
    const { fixture, page } = await renderWithScenario();
    expect(page.aiConfigured()).toBe(true);
    const explaining = page.explain();
    const request = http.expectOne(`${BASE}/ai/simulation/explain`);
    expect(request.request.body).toEqual({ route_ids: [3], elapsed_s: 90 });
    request.flush({ provider: 'groq', model: 'm', explanation: 'Todo en orden.', disclaimer: 'Académico.' });
    await explaining;
    // The map needs a real browser, so check the state instead of the DOM.
    expect(page.explanation()?.explanation).toBe('Todo en orden.');
    expect(page.explaining()).toBe(false);
    fixture.destroy();
  });

  it('saves the current instant to the history', async () => {
    const { fixture, page } = await renderWithScenario();
    page.runName.set('  Despegue ');
    const saving = page.saveRun();
    const request = http.expectOne(`${BASE}/simulation/runs`);
    expect(request.request.body).toEqual({ name: 'Despegue', route_ids: [3], elapsed_s: 90 });
    request.flush({});
    await saving;
    expect(page.saved()).toContain('Despegue');
    expect(page.runName()).toBe('');
    fixture.destroy();
  });
});
