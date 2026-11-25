import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { API_URL } from '../core/api.service';
import { FlightRoute, RouteInsights } from '../core/contracts';
import { RoutesPage } from './routes.page';

const BASE = 'http://api.test';
const tick = () => new Promise(resolve => setTimeout(resolve));

const route: FlightRoute = {
  id: 7, name: 'Bogotá — Medellín', aircraft_id: 1, created_at: '', updated_at: '',
  waypoints: [
    { id: 1, sequence: 0, latitude_deg: 4.7, longitude_deg: -74.1, altitude_m: 2600, speed_mps: 70 },
    { id: 2, sequence: 1, latitude_deg: 6.2, longitude_deg: -75.4, altitude_m: 2100, speed_mps: 70 },
  ],
};
const insights: RouteInsights = {
  route_id: 7, route_name: route.name, aircraft_registration: 'HK-123', waypoint_count: 2, leg_count: 1,
  total_distance_km: 240.3, estimated_duration_min: 57.2, min_altitude_m: 2100, max_altitude_m: 2600,
  min_speed_mps: 70, max_speed_mps: 70, aircraft_ceiling_m: 2700, ceiling_margin_m: 100, max_vertical_rate_mps: 0.1,
  warnings: ['Margen bajo el techo menor a 150 m.'],
};

describe('RoutesPage insights and review', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: API_URL, useValue: BASE }, provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function render() {
    const fixture = TestBed.createComponent(RoutesPage);
    fixture.detectChanges();
    http.expectOne(`${BASE}/routes?limit=100`).flush([route]);
    http.expectOne(`${BASE}/aircraft?limit=100`).flush([]);
    await tick(); fixture.detectChanges();
    return fixture;
  }

  it('shows metrics and warnings for a route', async () => {
    const fixture = await render();
    const loading = fixture.componentInstance.showInsights(route);
    http.expectOne(`${BASE}/routes/7/insights`).flush(insights);
    await loading; fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('MÉTRICAS DEL PLAN');
    expect(text).toContain('Margen bajo el techo menor a 150 m.');
  });

  it('labels a review that came from the rules fallback', async () => {
    const fixture = await render();
    fixture.componentInstance.insights.set(insights);
    const reviewing = fixture.componentInstance.review(7);
    http.expectOne(`${BASE}/ai/routes/7/review`).flush({
      source: 'rules', model: null, summary: 'Ruta de 240.3 km.', strengths: [], risks: insights.warnings,
      suggestions: ['Activa la asistencia IA.'], insights, disclaimer: 'Académico.',
    });
    await reviewing; fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.source-badge')?.textContent?.trim()).toBe('REGLAS');
    expect(element.textContent).toContain('La IA no estaba disponible');
  });
});
