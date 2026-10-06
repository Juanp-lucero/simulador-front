import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Aircraft, FlightRoute } from '../core/contracts';
import { errorMessage } from '../core/errors';

@Component({
  selector: 'app-dashboard', imports: [RouterLink],
  template: `
    <section class="page">
      <div class="page-heading"><div><div class="eyebrow">TU CENTRO DE OPERACIONES</div><h1>Vista general</h1><p>Prepara un escenario. Cada posición se calcula en el backend.</p></div><a class="button primary" routerLink="/simulation">Abrir simulador →</a></div>
      @if (error()) { <div class="error-box" role="alert">{{ error() }}</div> }
      @if (loading()) { <p class="muted">Cargando recursos desde la API…</p> }
      <div class="stat-grid">
        <a routerLink="/aircraft" class="stat-card"><span>AERONAVES REGISTRADAS</span><strong>{{ aircraft().length }}</strong><small>Tu flota disponible <b>↗</b></small></a>
        <a routerLink="/routes" class="stat-card"><span>PLANES DE RUTA</span><strong>{{ routes().length }}</strong><small>Rutas con waypoints <b>↗</b></small></a>
        <a routerLink="/simulation" class="stat-card"><span>RUTAS ASIGNADAS</span><strong>{{ assignedCount() }}</strong><small>Con aeronave vinculada <b>↗</b></small></a>
      </div>
      <div class="dashboard-grid">
        <article class="panel"><div class="panel-heading"><h2>Planes de ruta</h2><a routerLink="/routes" class="text-button">Gestionar →</a></div>
          @for (route of routes().slice(0, 5); track route.id) {
            <div class="list-row"><span class="route-symbol">⌁</span><div><strong>{{ route.name }}</strong><small>{{ route.waypoints.length }} waypoints · {{ route.aircraft_id ? 'Aeronave asignada' : 'Sin aeronave' }}</small></div><span class="tag">{{ route.aircraft_id ? 'ASIGNADA' : 'BORRADOR' }}</span></div>
          } @empty { <div class="empty-state"><span>⌁</span><h3>Tu primer plan empieza aquí</h3><p>Crea una aeronave y define al menos dos waypoints para una ruta.</p><a routerLink="/aircraft" class="button secondary">Crear aeronave</a></div> }
        </article>
        <article class="panel guide-panel"><div class="eyebrow">CÓMO FUNCIONA</div><h2>De un plan<br>a una trayectoria.</h2><div class="guide-step"><b>01</b><div>Registra una aeronave<small>Define velocidad de crucero y límite de altitud.</small></div></div><div class="guide-step"><b>02</b><div>Traza y asigna una ruta<small>Ordena coordenadas, altitudes y velocidades.</small></div></div><div class="guide-step"><b>03</b><div>Reproduce el escenario<small>Avanza el tiempo o busca un instante exacto.</small></div></div><div class="info-box">Modelo geométrico: sin viento, aceleración ni límites de ascenso. No representa operaciones reales.</div></article>
      </div>
      @if (aircraft().length === 100 || routes().length === 100) { <p class="muted">Esta vista muestra hasta 100 recursos por módulo.</p> }
    </section>
  `
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly aircraft = signal<Aircraft[]>([]);
  readonly routes = signal<FlightRoute[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  assignedCount() { return this.routes().filter(route => route.aircraft_id !== null).length; }
  async ngOnInit() {
    try {
      const [aircraft, routes] = await Promise.all([firstValueFrom(this.api.aircraft()), firstValueFrom(this.api.routes())]);
      this.aircraft.set(aircraft); this.routes.set(routes);
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.loading.set(false); }
  }
}
