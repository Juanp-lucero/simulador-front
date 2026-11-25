import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AiStatus, Aircraft, AircraftWrite, DashboardStats, HealthDetails, FlightRoute, RouteInsights, RouteReview, RouteWrite, SimulationRun, SimulationRunCreate, SimulationExplanation, SimulationRunSummary, Snapshot,
} from './contracts';

export const API_URL = new InjectionToken<string>('API_URL');

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);
  aircraft() { return this.http.get<Aircraft[]>(`${this.base}/aircraft?limit=100`); }
  createAircraft(data: AircraftWrite) { return this.http.post<Aircraft>(`${this.base}/aircraft`, data); }
  updateAircraft(id: number, data: AircraftWrite) { return this.http.put<Aircraft>(`${this.base}/aircraft/${id}`, data); }
  deleteAircraft(id: number) { return this.http.delete<void>(`${this.base}/aircraft/${id}`); }
  routes() { return this.http.get<FlightRoute[]>(`${this.base}/routes?limit=100`); }
  createRoute(data: RouteWrite) { return this.http.post<FlightRoute>(`${this.base}/routes`, data); }
  updateRoute(id: number, data: RouteWrite) { return this.http.put<FlightRoute>(`${this.base}/routes/${id}`, data); }
  deleteRoute(id: number) { return this.http.delete<void>(`${this.base}/routes/${id}`); }
  preview(route_ids: number[], elapsed_s: number) {
    return this.http.post<Snapshot>(`${this.base}/simulation/preview`, { route_ids, elapsed_s });
  }

  // Saved simulation runs
  runs(offset = 0, limit = 20) {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<SimulationRunSummary[]>(`${this.base}/simulation/runs`, { params });
  }
  run(id: number) { return this.http.get<SimulationRun>(`${this.base}/simulation/runs/${id}`); }
  saveRun(data: SimulationRunCreate) { return this.http.post<SimulationRun>(`${this.base}/simulation/runs`, data); }
  renameRun(id: number, name: string) { return this.http.patch<SimulationRun>(`${this.base}/simulation/runs/${id}`, { name }); }
  deleteRun(id: number) { return this.http.delete<void>(`${this.base}/simulation/runs/${id}`); }

  // Route metrics and review
  routeInsights(id: number) { return this.http.get<RouteInsights>(`${this.base}/routes/${id}/insights`); }
  reviewRoute(id: number) { return this.http.post<RouteReview>(`${this.base}/ai/routes/${id}/review`, {}); }

  // AI assistance
  aiStatus() { return this.http.get<AiStatus>(`${this.base}/ai/status`); }
  explainScenario(route_ids: number[], elapsed_s: number) {
    return this.http.post<SimulationExplanation>(`${this.base}/ai/simulation/explain`, { route_ids, elapsed_s });
  }
  explainRun(id: number) { return this.http.post<SimulationExplanation>(`${this.base}/ai/simulation/runs/${id}/explain`, {}); }

  // Dashboard and service status
  stats() { return this.http.get<DashboardStats>(`${this.base}/stats`); }
  healthDetails() { return this.http.get<HealthDetails>(`${this.base}/health/details`); }
}
