import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // ── Auth routes (public) ──────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'Sign In — CredX',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    title: 'Create Account — CredX',
  },

  // ── Protected routes ─────────────────────────────────────────────
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
    title: 'My Profile — CredX',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
    title: 'Job Dashboard — CredX',
  },

  // ── Fallback ──────────────────────────────────────────────────────
  { path: '**', redirectTo: '/dashboard' },
];
