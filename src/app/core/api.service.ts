import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Aircraft, AircraftWrite, FlightRoute, RouteWrite, Snapshot } from './contracts';

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
}
