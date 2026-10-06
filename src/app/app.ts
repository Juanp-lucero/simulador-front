import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { AuthPage } from './pages/auth.page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AuthPage],
  template: `
    @if (auth.user(); as user) {
      <div class="app-shell">
        <aside class="sidebar">
          <a routerLink="/" class="brand"><span class="brand-icon">A</span><span>AeroMind <b>IA</b><small>FLIGHT SIMULATION</small></span></a>
          <div class="nav-label">CENTRO DE SIMULACIÓN</div>
          <nav aria-label="Navegación principal">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"><span>◫</span> Resumen</a>
            <a routerLink="/aircraft" routerLinkActive="active"><span>✈</span> Aeronaves</a>
            <a routerLink="/routes" routerLinkActive="active"><span>⌁</span> Planes de ruta</a>
            <a routerLink="/simulation" routerLinkActive="active"><span>◎</span> Simulador</a>
          </nav>
          <div class="sidebar-note"><span class="status-dot"></span> Motor determinístico<small>Simulación geométrica académica.<br>No usar para operaciones reales.</small></div>
          <div class="account"><span class="avatar">{{ user.username.slice(0, 2).toUpperCase() }}</span><div>{{ user.username }}<small>{{ user.email }}</small></div><button class="icon-button" aria-label="Cerrar sesión" title="Cerrar sesión" (click)="auth.logout()">↪</button></div>
        </aside>
        <main class="workspace">
          <header class="topbar"><span>OPERATIONS / AEROMIND</span><div class="flex gap-3 items-center"><span class="environment-tag">ENTORNO ACADÉMICO</span><button class="text-button" (click)="auth.logout()">Salir</button></div></header>
          <router-outlet />
        </main>
      </div>
    } @else {
      <app-auth />
    }
  `
})
export class App {
  readonly auth = inject(AuthService);
}
