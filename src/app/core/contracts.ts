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
