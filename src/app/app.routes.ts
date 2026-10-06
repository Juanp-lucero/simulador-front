import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard.page').then(module => module.DashboardPage) },
  { path: 'aircraft', loadComponent: () => import('./pages/aircraft.page').then(module => module.AircraftPage) },
  { path: 'routes', loadComponent: () => import('./pages/routes.page').then(module => module.RoutesPage) },
  { path: 'simulation', loadComponent: () => import('./pages/simulation.page').then(module => module.SimulationPage) },
  { path: '**', redirectTo: '' },
];
