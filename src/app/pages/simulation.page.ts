import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { FlightRoute, SimulationExplanation, Snapshot } from '../core/contracts';
import { aiErrorMessage, errorMessage } from '../core/errors';
import { AiText } from '../shared/ai-text';
import { FlightMap } from '../shared/flight-map';
import { AltitudeChart } from '../shared/altitude-chart';

@Component({
  selector: 'app-simulation', imports: [FlightMap, AltitudeChart, DecimalPipe, AiText],
  template: `
    <section class="page">
      <div class="page-heading"><div><div class="eyebrow">REPRODUCCIÓN DETERMINÍSTICA</div><h1>Simulador</h1><p>Selecciona rutas y explora sus posiciones calculadas por la API.</p></div><span class="tag">{{ aiConfigured() ? 'MOTOR + ASISTENCIA IA' : 'MOTOR DETERMINÍSTICO · IA NO CONFIGURADA' }}</span></div>
      @if (error()) { <div class="error-box" role="alert">{{ error() }}</div> }
      <div class="simulation-layout">
        <article class="panel scenario-panel"><div class="panel-heading"><h2>Escenario</h2><span>◎</span></div><p class="field-hint">Selecciona hasta 25 rutas asignadas. Una aeronave no puede ocupar dos planes al mismo tiempo.</p>
          @for (route of routes(); track route.id) {
            <label class="route-choice"><input type="checkbox" [checked]="selection().has(route.id)" [disabled]="!route.aircraft_id || busy()" (change)="toggle(route.id)"><span>{{ route.name }}<small>{{ route.aircraft_id ? route.waypoints.length + ' waypoints' : 'Asigna una aeronave primero' }}</small></span></label>
          } @empty { <p class="muted">Crea y asigna rutas en Planes de ruta.</p> }
          <button class="button primary full" [disabled]="!selection().size || busy()" (click)="loadScenario()">{{ busy() ? 'Calculando…' : 'Cargar escenario' }}</button>
          <div class="info-box">El mapa usa OpenStreetMap. El motor no modela viento, aceleración ni separación operacional.</div>
        </article>
        <div class="simulation-main">
          <article class="map-card"><div class="map-title"><span class="status-dot"></span> Vista geográfica <span class="tag">{{ snapshot()?.states?.length ?? 0 }} AERONAVES</span></div><app-flight-map [routes]="sceneRoutes()" [states]="snapshot()?.states ?? []" /></article>
          @if (snapshot()) {
            <form class="panel save-run" (submit)="$event.preventDefault(); saveRun()">
              <label class="grow">Guardar este instante en el historial<input name="runName" maxlength="100" placeholder="Ej.: Bogotá — Medellín a los 30 min" [value]="runName()" (input)="runName.set($any($event.target).value)"></label>
              <button class="button secondary" type="submit" [disabled]="saving() || !runName().trim()">{{ saving() ? 'Guardando…' : 'Guardar' }}</button>
            </form>
            @if (saved()) { <div class="success-box" role="status">{{ saved() }}</div> }
          }
          <article class="panel playback-panel"><div class="playback-row"><button class="button primary" [disabled]="!snapshot()" (click)="playing.set(!playing())">{{ playing() ? 'Ⅱ Pausar' : '▶ Reproducir' }}</button><button class="button secondary" [disabled]="!snapshot() || busy()" (click)="seek(0)">↺ Reiniciar</button><label class="speed-label">Velocidad<select [value]="speed()" (change)="speed.set(+$any($event.target).value)"><option value="1">1×</option><option value="10">10×</option><option value="60">60×</option><option value="300">300×</option></select></label><span class="clock">{{ elapsed() | number:'1.0-0' }} <small>/ {{ duration() | number:'1.0-0' }} s</small></span></div>
            <input class="timeline" type="range" aria-label="Tiempo simulado en segundos" min="0" [max]="duration() || 1" [value]="elapsed()" [disabled]="!snapshot() || busy()" (change)="seek(+$any($event.target).value)">
          </article>
          @if (snapshot(); as current) {
            <div class="telemetry-grid"><article class="panel"><div class="panel-heading"><h2>Telemetría</h2><span class="tag">SI</span></div>
              @for (state of current.states; track state.aircraft_id) { <div class="telemetry-row"><div><strong>{{ state.registration }}</strong><small>{{ state.route_name }}</small></div><span>{{ state.altitude_m | number:'1.0-0' }} m<small>{{ state.speed_mps | number:'1.0-1' }} m/s</small></span><span>{{ state.progress * 100 | number:'1.0-0' }}%<small>{{ state.completed ? 'Completada' : 'WP ' + state.next_waypoint }}</small></span></div> }
            </article><article class="panel"><div class="panel-heading"><h2>Altitudes calculadas</h2><span class="tag">METROS</span></div><app-altitude-chart [states]="current.states" /></article></div>
            <article class="panel ai-panel" aria-live="polite"><div class="panel-heading"><div><div class="eyebrow">ASISTENCIA IA</div><h2>Explicación del escenario</h2></div><button class="button primary" [disabled]="explaining() || busy()" (click)="explain()">{{ explanation() ? 'Volver a explicar' : 'Explicar con IA' }}</button></div>
              @if (explaining()) { <p class="loading-line">La IA está analizando el instante {{ elapsed() | number:'1.0-0' }} s…</p> }
              @else if (aiError()) { <div class="error-box" role="alert">{{ aiError() }}</div> }
              @else if (explanation(); as answer) { <app-ai-text [text]="answer.explanation" /><p class="ai-meta">{{ answer.disclaimer }} · Modelo: {{ answer.model }}</p> }
              @else { <p class="muted">Pide una lectura en lenguaje natural de este instante. Los números siguen siendo los del motor, la IA solo los interpreta.</p> }
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class SimulationPage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  readonly routes = signal<FlightRoute[]>([]);
  readonly selection = signal(new Set<number>());
  readonly sceneIds = signal<number[]>([]);
  readonly snapshot = signal<Snapshot | null>(null);
  readonly error = signal(''); readonly busy = signal(false);
  readonly explanation = signal<SimulationExplanation | null>(null);
  readonly explaining = signal(false); readonly aiError = signal('');
  readonly aiConfigured = signal(false);
  readonly runName = signal(''); readonly saving = signal(false); readonly saved = signal('');
  readonly playing = signal(false); readonly speed = signal(60); readonly elapsed = signal(0);
  readonly sceneRoutes = computed(() => this.routes().filter(route => this.sceneIds().includes(route.id)));
  readonly duration = computed(() => Math.min(86400, Math.max(0, ...(this.snapshot()?.states.map(state => state.duration_s) ?? []))));
  private timer?: ReturnType<typeof setInterval>;
  private revision = 0;
  private destroyed = false;
  async ngOnInit() {
    try { this.routes.set(await firstValueFrom(this.api.routes())); }
    catch (error) { this.error.set(errorMessage(error)); }
    this.api.aiStatus().subscribe({ next: status => this.aiConfigured.set(status.configured), error: () => this.aiConfigured.set(false) });
    this.timer = setInterval(() => {
      if (this.playing() && !this.busy()) void this.render(Math.min(this.elapsed() + this.speed(), this.duration()));
    }, 1000);
  }
  toggle(id: number) { const selected = new Set(this.selection()); selected.has(id) ? selected.delete(id) : selected.add(id); this.selection.set(selected); }
  async loadScenario() {
    this.playing.set(false); this.sceneIds.set([...this.selection()]);
    this.explanation.set(null); this.aiError.set('');
    await this.render(0);
  }
  async seek(seconds: number) { this.playing.set(false); await this.render(seconds); }
  private async render(seconds: number) {
    const revision = ++this.revision;
    this.busy.set(true); this.error.set('');
    try {
      const result = await firstValueFrom(this.api.preview(this.sceneIds(), seconds));
      if (revision !== this.revision || this.destroyed) return;
      this.snapshot.set(result); this.elapsed.set(result.elapsed_s);
      if (result.states.every(state => state.completed) || seconds >= 86400) this.playing.set(false);
    } catch (error) {
      if (revision === this.revision && !this.destroyed) { this.error.set(errorMessage(error)); this.playing.set(false); }
    } finally { if (revision === this.revision && !this.destroyed) this.busy.set(false); }
  }
  async saveRun() {
    const name = this.runName().trim();
    if (!name || !this.snapshot()) return;
    this.saving.set(true); this.saved.set(''); this.error.set('');
    try {
      await firstValueFrom(this.api.saveRun({ name, route_ids: this.sceneIds(), elapsed_s: this.elapsed() }));
      this.saved.set(`"${name}" quedó guardado en el historial.`); this.runName.set('');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.saving.set(false); }
  }
  async explain() {
    if (!this.snapshot()) return;
    this.playing.set(false); this.explaining.set(true); this.aiError.set('');
    try { this.explanation.set(await firstValueFrom(this.api.explainScenario(this.sceneIds(), this.elapsed()))); }
    catch (error) { if (!this.destroyed) this.aiError.set(aiErrorMessage(error)); }
    finally { if (!this.destroyed) this.explaining.set(false); }
  }
  ngOnDestroy() { this.destroyed = true; this.revision++; if (this.timer) clearInterval(this.timer); }
}
