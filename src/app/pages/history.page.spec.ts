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
});
