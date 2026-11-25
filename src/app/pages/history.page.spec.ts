import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../core/api.service';
import { SimulationRun, SimulationRunSummary } from '../core/contracts';
import { HistoryPage, RUNS_PAGE_SIZE } from './history.page';

const BASE = 'http://api.test';
const tick = () => new Promise(resolve => setTimeout(resolve));

function summary(id: number, extra: Partial<SimulationRunSummary> = {}): SimulationRunSummary {
  return { id, name: `Run ${id}`, route_ids: [1], elapsed_s: 60, has_explanation: false, created_at: '2026-11-24T10:00:00Z', ...extra };
}

describe('HistoryPage', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_URL, useValue: BASE }, provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function render(runs: SimulationRunSummary[]) {
    const fixture = TestBed.createComponent(HistoryPage);
    fixture.detectChanges();
    http.expectOne(r => r.url === `${BASE}/simulation/runs` && r.params.get('offset') === '0').flush(runs);
    await tick(); fixture.detectChanges();
    return fixture;
  }

  it('lists runs and only enables "next" when the page is full', async () => {
    const fixture = await render([summary(1, { has_explanation: true })]);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Run 1');
    expect(element.textContent).toContain('CON IA');
    expect(fixture.componentInstance.hasMore()).toBe(false);

    const full = await render(Array.from({ length: RUNS_PAGE_SIZE }, (_, index) => summary(index + 1)));
    expect(full.componentInstance.hasMore()).toBe(true);
  });

  it('shows an empty state without runs', async () => {
    const fixture = await render([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aún no hay simulaciones guardadas');
  });

  it('explains a saved run and marks it as explained', async () => {
    const fixture = await render([summary(4)]);
    const page = fixture.componentInstance;
    const run: SimulationRun = { ...summary(4), result: { elapsed_s: 60, states: [] }, explanation: null };

    const opening = page.open(4);
    http.expectOne(`${BASE}/simulation/runs/4`).flush(run);
    await opening;

    const explaining = page.explain(run);
    http.expectOne(`${BASE}/ai/simulation/runs/4/explain`).flush({ provider: 'groq', model: 'm', explanation: '## Resumen\nTodo bien', disclaimer: 'd' });
    await explaining;
    fixture.detectChanges();

    expect(page.selected()?.explanation).toContain('Todo bien');
    expect(page.runs()[0].has_explanation).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.ai-text h3')?.textContent).toBe('Resumen');
  });

  it('shows a friendly message when the AI is not configured', async () => {
    const fixture = await render([summary(4)]);
    const page = fixture.componentInstance;
    const run: SimulationRun = { ...summary(4), result: { elapsed_s: 60, states: [] }, explanation: null };
    const explaining = page.explain(run);
    http.expectOne(`${BASE}/ai/simulation/runs/4/explain`).flush({ detail: 'x' }, { status: 503, statusText: 'Unavailable' });
    await explaining;
    expect(page.aiError()).toContain('no está configurada');
  });

  it('renames and deletes a run', async () => {
    const fixture = await render([summary(4)]);
    const page = fixture.componentInstance;
    const run: SimulationRun = { ...summary(4), result: { elapsed_s: 60, states: [] }, explanation: null };
    page.selected.set(run);

    vi.spyOn(window, 'prompt').mockReturnValue('  Vuelo final ');
    const renaming = page.rename(run);
    const rename = http.expectOne(`${BASE}/simulation/runs/4`);
    expect(rename.request.body).toEqual({ name: 'Vuelo final' });
    rename.flush({ ...run, name: 'Vuelo final' });
    await renaming;
    expect(page.runs()[0].name).toBe('Vuelo final');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const removing = page.remove(run);
    http.expectOne(r => r.method === 'DELETE').flush(null);
    await tick();
    http.expectOne(r => r.url === `${BASE}/simulation/runs`).flush([]);
    await removing;
    expect(page.selected()).toBeNull();
    expect(page.runs()).toEqual([]);
  });
});
