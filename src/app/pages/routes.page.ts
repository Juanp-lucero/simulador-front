import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Aircraft, FlightRoute, RouteWrite, WaypointWrite } from '../core/contracts';
import { errorMessage } from '../core/errors';

function waypointForm(point?: WaypointWrite) {
  return new FormGroup({
    latitude_deg: new FormControl<number | null>(point?.latitude_deg ?? null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude_deg: new FormControl<number | null>(point?.longitude_deg ?? null, [Validators.required, Validators.min(-180), Validators.max(180)]),
    altitude_m: new FormControl(point?.altitude_m ?? 1000, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(20000)] }),
    speed_mps: new FormControl(point?.speed_mps ?? 60, { nonNullable: true, validators: [Validators.required, Validators.min(0.1), Validators.max(400)] }),
  });
}

@Component({
  selector: 'app-routes', imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-heading"><div><div class="eyebrow">PLANIFICACIÓN</div><h1>Planes de ruta</h1><p>Waypoints ordenados para un recorrido sobre la esfera terrestre.</p></div><span class="tag">GRADOS · METROS · m/s</span></div>
      @if (error()) { <div class="error-box" role="alert">{{ error() }}</div> }
      @if (message()) { <div class="success-box" role="status">{{ message() }}</div> }
      <article class="panel route-form-panel"><div class="panel-heading"><h2>{{ editingId() ? 'Editar plan de ruta' : 'Nuevo plan de ruta' }}</h2><span class="tag">2–100 WAYPOINTS</span></div>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-two"><label>Nombre de la ruta<input formControlName="name" placeholder="Bogotá — Medellín" maxlength="100"></label><label>Aeronave asignada<select formControlName="aircraft_id"><option [ngValue]="null">Sin asignar</option>@for (item of aircraft(); track item.id) { <option [ngValue]="item.id">{{ item.registration }} · {{ item.model_name }}</option> }</select></label></div>
          <div class="waypoint-scroll" formArrayName="waypoints">
            <div class="waypoint-header"><span>#</span><span>Latitud (°)</span><span>Longitud (°)</span><span>Altitud (m)</span><span>Velocidad (m/s)</span><span></span></div>
            @for (point of waypoints.controls; track point; let index = $index) {
              <div class="waypoint-row" [formGroupName]="index"><b>{{ index + 1 }}</b><input type="number" formControlName="latitude_deg" step="0.0001" [attr.aria-label]="'Latitud waypoint ' + (index + 1)" placeholder="4.7016"><input type="number" formControlName="longitude_deg" step="0.0001" [attr.aria-label]="'Longitud waypoint ' + (index + 1)" placeholder="-74.1469"><input type="number" formControlName="altitude_m" step="1" [attr.aria-label]="'Altitud waypoint ' + (index + 1)"><input type="number" formControlName="speed_mps" step="0.1" [attr.aria-label]="'Velocidad waypoint ' + (index + 1)"><button class="icon-button danger" type="button" [disabled]="waypoints.length <= 2" (click)="waypoints.removeAt(index)" [attr.aria-label]="'Quitar waypoint ' + (index + 1)">×</button></div>
            }
          </div>
          <div class="form-footer"><button class="text-button" type="button" [disabled]="waypoints.length >= 100" (click)="waypoints.push(newWaypoint())">+ Agregar waypoint</button><div class="flex gap-3">@if (editingId()) { <button class="button secondary" type="button" (click)="reset()">Cancelar</button> }<button class="button primary" type="submit" [disabled]="busy()">{{ busy() ? 'Guardando…' : editingId() ? 'Guardar cambios' : 'Crear ruta' }}</button></div></div>
        </form>
      </article>
      <article class="panel"><div class="panel-heading"><h2>Tus planes</h2><span class="tag">{{ routes().length }} RUTAS</span></div>
        @for (route of routes(); track route.id) {
          <div class="list-row"><span class="route-symbol">⌁</span><div class="grow"><strong>{{ route.name }}</strong><small>{{ route.waypoints.length }} waypoints · {{ aircraftName(route.aircraft_id) }}</small></div><button class="text-button" (click)="edit(route)">Editar</button><button class="text-button danger" [disabled]="busy()" (click)="remove(route)">Eliminar</button></div>
        } @empty { <div class="empty-state"><span>⌁</span><h3>Aún no hay planes</h3><p>Define la posición de salida y llegada para empezar.</p></div> }
      </article>
    </section>
  `
})
export class RoutesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly routes = signal<FlightRoute[]>([]); readonly aircraft = signal<Aircraft[]>([]);
  readonly editingId = signal<number | null>(null); readonly busy = signal(false);
  readonly error = signal(''); readonly message = signal('');
  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    aircraft_id: this.fb.control<number | null>(null),
    waypoints: this.fb.array([waypointForm(), waypointForm()]),
  });
  get waypoints() { return this.form.controls.waypoints; }
  newWaypoint() { return waypointForm(); }
  aircraftName(id: number | null) { return this.aircraft().find(item => item.id === id)?.registration ?? 'Sin asignar'; }
  async ngOnInit() { await this.load(); }
  async load() {
    try {
      const [routes, aircraft] = await Promise.all([firstValueFrom(this.api.routes()), firstValueFrom(this.api.aircraft())]);
      this.routes.set(routes); this.aircraft.set(aircraft);
    } catch (error) { this.error.set(errorMessage(error)); }
  }
  edit(route: FlightRoute) {
    this.editingId.set(route.id); this.error.set(''); this.message.set('');
    this.form.patchValue({ name: route.name, aircraft_id: route.aircraft_id });
    this.waypoints.clear(); route.waypoints.forEach(point => this.waypoints.push(waypointForm(point)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  reset() {
    this.editingId.set(null); this.form.patchValue({ name: '', aircraft_id: null });
    this.waypoints.clear(); this.waypoints.push(waypointForm()); this.waypoints.push(waypointForm());
  }
  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error.set('Completa todos los waypoints y revisa los rangos.'); return; }
    const raw = this.form.getRawValue();
    const payload: RouteWrite = { ...raw, waypoints: raw.waypoints.map(point => ({ ...point, latitude_deg: Number(point.latitude_deg), longitude_deg: Number(point.longitude_deg) })) };
    this.busy.set(true); this.error.set(''); this.message.set('');
    try {
      const id = this.editingId();
      await firstValueFrom(id ? this.api.updateRoute(id, payload) : this.api.createRoute(payload));
      this.reset(); this.message.set('Plan de ruta guardado.'); await this.load();
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
  async remove(route: FlightRoute) {
    if (!confirm(`¿Eliminar el plan "${route.name}" y sus waypoints?`)) return;
    this.busy.set(true); this.error.set('');
    try { await firstValueFrom(this.api.deleteRoute(route.id)); if (this.editingId() === route.id) this.reset(); await this.load(); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
