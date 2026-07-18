import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);

  /** Read-only signal for the toast component to render */
  readonly toasts = this._toasts.asReadonly();

  // ── Public API ──────────────────────────────────────────────────────────────

  success(message: string, duration = 3500): void {
    this.push({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000): void {
    this.push({ type: 'error', message, duration });
  }

  warning(message: string, duration = 4000): void {
    this.push({ type: 'warning', message, duration });
  }

  info(message: string, duration = 3500): void {
    this.push({ type: 'info', message, duration });
  }

  dismiss(id: string): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private push(toast: Omit<Toast, 'id'>): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const full: Toast = { id, ...toast };

    this._toasts.update((list) => [...list, full]);

    // Auto-dismiss after duration
    if (full.duration && full.duration > 0) {
      setTimeout(() => this.dismiss(id), full.duration);
    }
  }
}
