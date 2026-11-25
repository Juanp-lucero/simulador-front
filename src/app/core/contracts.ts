export interface User {
  id: number; username: string; email: string; role: 'admin' | 'user'; is_active: boolean;
}
export interface AircraftWrite {
  registration: string; model_name: string; cruise_speed_mps: number; max_altitude_m: number;
}
export interface Aircraft extends AircraftWrite { id: number; created_at: string; updated_at: string; }
export interface WaypointWrite {
  latitude_deg: number; longitude_deg: number; altitude_m: number; speed_mps: number;
}
export interface Waypoint extends WaypointWrite { id: number; sequence: number; }
export interface RouteWrite { name: string; aircraft_id: number | null; waypoints: WaypointWrite[]; }
export interface FlightRoute extends RouteWrite { id: number; created_at: string; updated_at: string; waypoints: Waypoint[]; }
export interface AircraftState {
  aircraft_id: number; registration: string; route_id: number; route_name: string;
  latitude_deg: number; longitude_deg: number; altitude_m: number; speed_mps: number;
  heading_deg: number; next_waypoint: number | null; progress: number; duration_s: number; completed: boolean;
}
export interface Snapshot { elapsed_s: number; states: AircraftState[]; }

/** Saved simulation scenario as listed by `GET /simulation/runs`. */
export interface SimulationRunSummary {
  id: number; name: string; route_ids: number[]; elapsed_s: number; has_explanation: boolean; created_at: string;
}
/** Saved scenario with its deterministic result and optional AI explanation. */
export interface SimulationRun extends SimulationRunSummary { result: Snapshot; explanation: string | null; }
export interface SimulationRunCreate { name: string; route_ids: number[]; elapsed_s: number; }

/** Metrics computed by the backend for one route plan. */
export interface RouteInsights {
  route_id: number; route_name: string; aircraft_registration: string | null;
  waypoint_count: number; leg_count: number; total_distance_km: number; estimated_duration_min: number;
  min_altitude_m: number; max_altitude_m: number; min_speed_mps: number; max_speed_mps: number;
  aircraft_ceiling_m: number | null; ceiling_margin_m: number | null; max_vertical_rate_mps: number;
  warnings: string[];
}
/** Route review written by Groq (`ai`) or by the deterministic rules (`rules`). */
export interface RouteReview {
  source: 'ai' | 'rules'; model: string | null; summary: string;
  strengths: string[]; risks: string[]; suggestions: string[];
  insights: RouteInsights; disclaimer: string;
}

export interface AiStatus { provider: string; configured: boolean; model: string; }
export interface SimulationExplanation { provider: string; model: string; explanation: string; disclaimer: string; }
export interface DashboardStats {
  aircraft_count: number; route_count: number; routes_without_aircraft: number;
  simulation_run_count: number; explained_run_count: number; planned_distance_km: number;
}
export interface HealthDetails { status: string; database: string; ai_configured: boolean; }
