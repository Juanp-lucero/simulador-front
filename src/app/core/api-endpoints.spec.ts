import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { API_URL, ApiService } from './api.service';

const BASE = 'http://localhost:8000';

describe('ApiService endpoints', () => {
  let http: HttpTestingController;
  let api: ApiService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_URL, useValue: BASE }, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(ApiService);
  });
  afterEach(() => http.verify());

  it('lists saved runs with pagination', () => {
    api.runs(20, 10).subscribe();
    const request = http.expectOne(r => r.url === `${BASE}/simulation/runs`);
    expect(request.request.params.get('offset')).toBe('20');
    expect(request.request.params.get('limit')).toBe('10');
    request.flush([]);
  });

  it('saves, renames and deletes a run', () => {
    api.saveRun({ name: 'Prueba', route_ids: [1], elapsed_s: 30 }).subscribe();
    const save = http.expectOne(`${BASE}/simulation/runs`);
    expect(save.request.method).toBe('POST');
    expect(save.request.body).toEqual({ name: 'Prueba', route_ids: [1], elapsed_s: 30 });
    save.flush({});

    api.renameRun(3, 'Nuevo').subscribe();
    const rename = http.expectOne(`${BASE}/simulation/runs/3`);
    expect(rename.request.method).toBe('PATCH');
    expect(rename.request.body).toEqual({ name: 'Nuevo' });
    rename.flush({});

    api.deleteRun(3).subscribe();
    const remove = http.expectOne(`${BASE}/simulation/runs/3`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });

  it('requests route insights and an AI review', () => {
    api.routeInsights(7).subscribe();
    const insights = http.expectOne(`${BASE}/routes/7/insights`);
    expect(insights.request.method).toBe('GET');
    insights.flush({});

    api.reviewRoute(7).subscribe();
    const review = http.expectOne(`${BASE}/ai/routes/7/review`);
    expect(review.request.method).toBe('POST');
    review.flush({});
  });

  it('asks the AI to explain a scenario or a saved run', () => {
    api.explainScenario([1, 2], 120).subscribe();
    const scenario = http.expectOne(`${BASE}/ai/simulation/explain`);
    expect(scenario.request.body).toEqual({ route_ids: [1, 2], elapsed_s: 120 });
    scenario.flush({});

    api.explainRun(5).subscribe();
    const run = http.expectOne(`${BASE}/ai/simulation/runs/5/explain`);
    expect(run.request.method).toBe('POST');
    run.flush({});
  });

  it('reads dashboard stats and service health', () => {
    api.stats().subscribe();
    http.expectOne(`${BASE}/stats`).flush({});
    api.healthDetails().subscribe();
    http.expectOne(`${BASE}/health/details`).flush({ status: 'ok', database: 'connected', ai_configured: true });
  });
});
