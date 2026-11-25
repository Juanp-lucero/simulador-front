import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { SimulationRun, SimulationRunSummary } from '../core/contracts';
import { errorMessage } from '../core/errors';
import { formatDate, formatDuration } from '../core/format';

export const RUNS_PAGE_SIZE = 10;

@Component({
  selector: 'app-history', imports: [DecimalPipe],
  template: `
    <section class="page">
      <div class="page-heading"><div><div class="eyebrow">REGISTRO</div><h1>Historial de simulaciones</h1><p>Instantes guardados desde el simulador, con su resultado calculado.</p></div><span class="tag">{{ runs().length }} EN ESTA PÁGINA</span></div>
      @if (error()) { <div class="error-box" role="alert">{{ error() }}</div> }
      <div class="dashboard-grid">
      <article class="panel">
        @if (loading()) { <p class="loading-line">Cargando historial…</p> }
        @for (run of runs(); track run.id) {
          <div class="list-row selectable" [class.selected]="selected()?.id === run.id" role="button" tabindex="0" (click)="open(run.id)" (keydown.enter)="open(run.id)"><span class="route-symbol">◷</span><div class="grow"><strong>{{ run.name }}</strong><small>{{ run.route_ids.length }} ruta(s) · instante {{ duration(run.elapsed_s) }} · {{ date(run.created_at) }}</small></div>
            @if (run.has_explanation) { <span class="source-badge ai">CON IA</span> }
          </div>
        } @empty {
          @if (!loading()) { <div class="empty-state"><span>◷</span><h3>Aún no hay simulaciones guardadas</h3><p>En el simulador, carga un escenario y usa "Guardar" para conservar un instante.</p></div> }
        }
        <div class="form-footer"><button class="button secondary" [disabled]="page() === 0 || loading()" (click)="go(page() - 1)">← Anteriores</button><span class="muted">Página {{ page() + 1 }}</span><button class="button secondary" [disabled]="!hasMore() || loading()" (click)="go(page() + 1)">Siguientes →</button></div>
      </article>
      <article class="panel">
        @if (detailLoading()) { <p class="loading-line">Cargando simulación…</p> }
        @else if (selected(); as run) {
          <div class="panel-heading"><div><div class="eyebrow">DETALLE</div><h2>{{ run.name }}</h2></div><span class="tag">{{ duration(run.elapsed_s) }}</span></div>
          @for (state of run.result.states; track state.aircraft_id) {
            <div class="telemetry-row"><div><strong>{{ state.registration }}</strong><small>{{ state.route_name }}</small></div><span>{{ state.altitude_m | number:'1.0-0' }} m<small>{{ state.speed_mps | number:'1.0-1' }} m/s</small></span><span>{{ state.progress * 100 | number:'1.0-0' }}%<small>{{ state.completed ? 'Completada' : 'WP ' + state.next_waypoint }}</small></span></div>
          }
        } @else { <div class="empty-state"><span>◎</span><h3>Selecciona una simulación</h3><p>Verás la telemetría guardada y su explicación con IA.</p></div> }
      </article>
      </div>
    </section>
  `,
})
export class HistoryPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly runs = signal<SimulationRunSummary[]>([]);
  readonly page = signal(0);
  readonly hasMore = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selected = signal<SimulationRun | null>(null);
  readonly detailLoading = signal(false);
  readonly duration = formatDuration;
  readonly date = formatDate;

  async ngOnInit() { await this.go(0); }

  async go(page: number) {
    this.loading.set(true); this.error.set('');
    try {
      const runs = await firstValueFrom(this.api.runs(page * RUNS_PAGE_SIZE, RUNS_PAGE_SIZE));
      this.runs.set(runs); this.page.set(page); this.hasMore.set(runs.length === RUNS_PAGE_SIZE);
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.loading.set(false); }
  }

  async open(id: number) {
    this.detailLoading.set(true); this.error.set('');
    try { this.selected.set(await firstValueFrom(this.api.run(id))); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.detailLoading.set(false); }
  }
}
