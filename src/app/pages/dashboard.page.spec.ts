import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../core/api.service';
import { DashboardPage } from './dashboard.page';

const BASE = 'http://api.test';
const tick = () => new Promise(resolve => setTimeout(resolve));

describe('DashboardPage', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_URL, useValue: BASE }, provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses /stats totals, warns about unassigned routes and lists recent runs', async () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    http.expectOne(`${BASE}/aircraft?limit=100`).flush([]);
    http.expectOne(`${BASE}/routes?limit=100`).flush([]);
    await tick();
    http.expectOne(r => r.url === `${BASE}/simulation/runs` && r.params.get('limit') === '3').flush([
      { id: 1, name: 'Aproximación', route_ids: [1], elapsed_s: 30, has_explanation: true, created_at: '2026-11-24T10:00:00Z' },
    ]);
    http.expectOne(`${BASE}/stats`).flush({
      aircraft_count: 120, route_count: 8, routes_without_aircraft: 2,
      simulation_run_count: 5, explained_run_count: 3, planned_distance_km: 1520.4,
    });
    fixture.detectChanges();

    const page = fixture.componentInstance;
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(page.assignedCount()).toBe(6);
    expect(text).toContain('120');
    expect(text).toContain('2 plan(es) de ruta no tienen aeronave');
    expect(text).toContain('Aproximación');
  });
});
