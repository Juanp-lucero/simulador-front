import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Aircraft, FlightRoute, RouteInsights, RouteReview, RouteWrite, WaypointWrite } from '../core/contracts';
import { formatKm } from '../core/format';
import { aiErrorMessage, errorMessage } from '../core/errors';
import { AiText } from '../shared/ai-text';

function waypointForm(point?: WaypointWrite) {
  return new FormGroup({
    latitude_deg: new FormControl<number | null>(point?.latitude_deg ?? null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude_deg: new FormControl<number | null>(point?.longitude_deg ?? null, [Validators.required, Validators.min(-180), Validators.max(180)]),
    altitude_m: new FormControl(point?.altitude_m ?? 1000, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(20000)] }),
    speed_mps: new FormControl(point?.speed_mps ?? 60, { nonNullable: true, validators: [Validators.required, Validators.min(0.1), Validators.max(400)] }),
  });
}

@Component({
  selector: 'app-routes', imports: [ReactiveFormsModule, DecimalPipe, AiText],
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
          <div class="list-row"><span class="route-symbol">⌁</span><div class="grow"><strong>{{ route.name }}</strong><small>{{ route.waypoints.length }} waypoints · {{ aircraftName(route.aircraft_id) }}</small></div><button class="text-button" (click)="showInsights(route)">Métricas</button><button class="text-button" (click)="edit(route)">Editar</button><button class="text-button danger" [disabled]="busy()" (click)="remove(route)">Eliminar</button></div>
        } @empty { <div class="empty-state"><span>⌁</span><h3>Aún no hay planes</h3><p>Define la posición de salida y llegada para empezar.</p></div> }
      </article>
      @if (insightsLoading()) { <article class="panel"><p class="loading-line">Calculando métricas del plan…</p></article> }
      @else if (insights(); as data) {
        <article class="panel" aria-live="polite"><div class="panel-heading"><div><div class="eyebrow">MÉTRICAS DEL PLAN</div><h2>{{ data.route_name }}</h2></div><button class="icon-button" aria-label="Cerrar métricas" (click)="closeInsights()">×</button></div>
          <div class="metric-grid">
            <div><span>Distancia</span><strong>{{ km(data.total_distance_km) }}</strong></div>
            <div><span>Duración estimada</span><strong>{{ data.estimated_duration_min | number:'1.0-1' }} min</strong></div>
            <div><span>Tramos</span><strong>{{ data.leg_count }}</strong></div>
            <div><span>Altitud</span><strong>{{ data.min_altitude_m | number:'1.0-0' }}–{{ data.max_altitude_m | number:'1.0-0' }} m</strong></div>
            <div><span>Velocidad</span><strong>{{ data.min_speed_mps | number:'1.0-1' }}–{{ data.max_speed_mps | number:'1.0-1' }} m/s</strong></div>
            <div><span>Margen bajo el techo</span><strong>{{ data.ceiling_margin_m === null ? '—' : (data.ceiling_margin_m | number:'1.0-0') + ' m' }}</strong></div>
          </div>
          @if (data.warnings.length) {
            <div class="warning-list" role="list">@for (warning of data.warnings; track warning) { <p role="listitem">⚠ {{ warning }}</p> }</div>
          } @else { <div class="success-box">Sin alertas en los chequeos automáticos.</div> }
        </article>
        <article class="panel ai-panel" aria-live="polite"><div class="panel-heading"><div><div class="eyebrow">REVISIÓN DEL PLAN</div><h2>¿Es coherente este plan?</h2></div><button class="button primary" [disabled]="reviewing()" (click)="review(data.route_id)">{{ reviewResult() ? 'Revisar de nuevo' : 'Revisar con IA' }}</button></div>
          @if (reviewing()) { <p class="loading-line">Revisando altitudes, velocidades y tramos…</p> }
          @else if (reviewError()) { <div class="error-box" role="alert">{{ reviewError() }}</div> }
          @else if (reviewResult(); as result) {
            <p><span class="source-badge" [class.ai]="result.source === 'ai'" [class.rules]="result.source === 'rules'">{{ result.source === 'ai' ? 'IA · ' + result.model : 'REGLAS' }}</span></p>
            <app-ai-text [text]="result.summary" />
            @if (result.strengths.length) { <h3 class="review-title">Fortalezas</h3>@for (item of result.strengths; track item) { <p class="ai-bullet">{{ item }}</p> } }
            @if (result.risks.length) { <h3 class="review-title">Riesgos</h3>@for (item of result.risks; track item) { <p class="ai-bullet">{{ item }}</p> } }
            @if (result.suggestions.length) { <h3 class="review-title">Sugerencias</h3>@for (item of result.suggestions; track item) { <p class="ai-bullet">{{ item }}</p> } }
            <p class="ai-meta">{{ result.disclaimer }}</p>
            @if (result.source === 'rules') { <p class="ai-meta">La IA no estaba disponible: esta revisión salió de los chequeos automáticos.</p> }
          } @else { <p class="muted">La IA lee las métricas calculadas y señala fortalezas, riesgos y mejoras del plan.</p> }
        </article>
      }
    </section>
  `
})
export class RoutesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly routes = signal<FlightRoute[]>([]); readonly aircraft = signal<Aircraft[]>([]);
  readonly editingId = signal<number | null>(null); readonly busy = signal(false);
  readonly error = signal(''); readonly message = signal('');
  readonly insights = signal<RouteInsights | null>(null); readonly insightsLoading = signal(false);
  readonly km = formatKm;
  readonly reviewResult = signal<RouteReview | null>(null); readonly reviewing = signal(false); readonly reviewError = signal('');
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
      this.reset(); this.closeInsights(); this.message.set('Plan de ruta guardado.'); await this.load();
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
  async remove(route: FlightRoute) {
    if (!confirm(`¿Eliminar el plan "${route.name}" y sus waypoints?`)) return;
    this.busy.set(true); this.error.set('');
    try {
      await firstValueFrom(this.api.deleteRoute(route.id));
      if (this.editingId() === route.id) this.reset();
      if (this.insights()?.route_id === route.id) this.closeInsights();
      await this.load();
    }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }

  async showInsights(route: FlightRoute) {
    this.insightsLoading.set(true); this.error.set('');
    this.reviewResult.set(null); this.reviewError.set('');
    try { this.insights.set(await firstValueFrom(this.api.routeInsights(route.id))); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.insightsLoading.set(false); }
  }
  closeInsights() { this.insights.set(null); this.reviewResult.set(null); this.reviewError.set(''); }

  async review(routeId: number) {
    this.reviewing.set(true); this.reviewError.set('');
    try { this.reviewResult.set(await firstValueFrom(this.api.reviewRoute(routeId))); }
    catch (error) { this.reviewError.set(aiErrorMessage(error)); }
    finally { this.reviewing.set(false); }
  }
}
