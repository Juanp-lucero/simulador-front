import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Resumen · AeroMind IA', loadComponent: () => import('./pages/dashboard.page').then(module => module.DashboardPage) },
  { path: 'aircraft', title: 'Aeronaves · AeroMind IA', loadComponent: () => import('./pages/aircraft.page').then(module => module.AircraftPage) },
  { path: 'routes', title: 'Planes de ruta · AeroMind IA', loadComponent: () => import('./pages/routes.page').then(module => module.RoutesPage) },
  { path: 'simulation', title: 'Simulador · AeroMind IA', loadComponent: () => import('./pages/simulation.page').then(module => module.SimulationPage) },
  { path: 'history', title: 'Historial · AeroMind IA', loadComponent: () => import('./pages/history.page').then(module => module.HistoryPage) },
  { path: '**', redirectTo: '' },
];
