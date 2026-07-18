import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">

      <!-- Background Glow -->
      <div class="auth-page__glow auth-page__glow--left"></div>
      <div class="auth-page__glow auth-page__glow--right"></div>

      <div class="auth-card glass animate-fade-in-up">

        <!-- Logo -->
        <div class="auth-card__logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;">
            <defs>
              <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#a855f7"/>
                <stop offset="1" stop-color="#22d3ee"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#loginLogoGrad)" opacity="0.2"/>
            <path d="M8 10h10a6 6 0 0 1 0 12H8" stroke="url(#loginLogoGrad)" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M8 16h8" stroke="url(#loginLogoGrad)" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="24" cy="22" r="1.5" fill="#22d3ee"/>
          </svg>
          <span class="auth-card__brand">Cred<span class="gradient-text">X</span></span>
        </div>

        <!-- Header -->
        <div class="auth-card__header">
          <h1 class="auth-card__title">Welcome back</h1>
          <p class="auth-card__subtitle">Sign in to your account to continue</p>
        </div>

        <!-- Error Banner -->
        @if (errorMsg()) {
          <div class="auth-error animate-fade-in" role="alert" style="align-items: flex-start; gap: 12px; padding: 16px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:20px;height:20px;flex-shrink:0;margin-top:2px;">
              <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
            </svg>
            <div style="flex: 1;">
              <p style="margin: 0 0 8px 0; font-weight: 500;">{{ errorMsg() }}</p>
              @if (showDemoFallback()) {
                <button type="button" class="btn-demo-trigger" (click)="startDemoMode()">
                  Explore in Demo Mode (Mock Data) →
                </button>
              }
            </div>
          </div>
        }

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" novalidate>

          <!-- Email -->
          <div class="auth-field">
            <label class="form-label" for="login-email">Email address</label>
            <div class="auth-field__input-wrap">
              <svg class="auth-field__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"/>
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"/>
              </svg>
              <input
                id="login-email"
                type="email"
                formControlName="email"
                class="form-input auth-field__input"
                [class.error]="isInvalid('email')"
                placeholder="you@example.com"
                autocomplete="email"
              />
            </div>
            @if (isInvalid('email')) {
              <p class="auth-field__error">Please enter a valid email address.</p>
            }
          </div>

          <!-- Password -->
          <div class="auth-field">
            <div class="auth-field__label-row">
              <label class="form-label" for="login-password">Password</label>
              <a href="#" class="auth-field__forgot" (click)="$event.preventDefault()">Forgot password?</a>
            </div>
            <div class="auth-field__input-wrap">
              <svg class="auth-field__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clip-rule="evenodd"/>
              </svg>
              <input
                id="login-password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                class="form-input auth-field__input"
                [class.error]="isInvalid('password')"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="auth-field__eye"
                (click)="togglePassword()"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                @if (showPassword()) {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                    <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                    <path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clip-rule="evenodd"/>
                    <path d="m10.748 13.93 2.523 2.524a10.002 10.002 0 0 1-8.545-3.949 1.651 1.651 0 0 1-.026-1.187 10.06 10.06 0 0 1 1.51-2.498l1.086 1.085a4 4 0 0 0 3.452 3.525Z"/>
                  </svg>
                }
              </button>
            </div>
            @if (isInvalid('password')) {
              <p class="auth-field__error">Password is required.</p>
            }
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn-primary auth-submit"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="auth-spinner"></span>
              Signing in…
            } @else {
              Sign in
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                <path fill-rule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clip-rule="evenodd"/>
              </svg>
            }
          </button>

        </form>

        <!-- Divider -->
        <div class="auth-divider">
          <hr class="auth-divider__line">
          <span class="auth-divider__text">or</span>
          <hr class="auth-divider__line">
        </div>

        <!-- Footer -->
        <p class="auth-card__footer">
          Don't have an account?
          <a routerLink="/register" class="auth-card__link">Create one for free →</a>
        </p>

        <!-- Demo hint -->
        <div class="auth-demo-hint">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px;flex-shrink:0;color:#6366f1;">
            <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd"/>
          </svg>
          <span>Demo: <code>student&#64;credx.dev</code> / <code>password123</code></span>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .auth-page__glow {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
    }

    .auth-page__glow--left {
      left: -150px;
      top: -100px;
      background: radial-gradient(circle, rgba(124,111,247,0.18) 0%, transparent 70%);
    }

    .auth-page__glow--right {
      right: -150px;
      bottom: -100px;
      background: radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%);
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: relative;
      z-index: 1;
    }

    .auth-card__logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .auth-card__brand {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .auth-card__header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .auth-card__title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .auth-card__subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0;
    }

    .auth-error {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.2);
      border-radius: 10px;
      color: #e11d48;
      font-size: 0.875rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .auth-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .auth-field__label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .auth-field__forgot {
      font-size: 0.8rem;
      color: #4f46e5;
      text-decoration: none;
      transition: color 0.2s;
    }

    .auth-field__forgot:hover {
      color: #3730a3;
    }

    .auth-field__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .auth-field__icon {
      position: absolute;
      left: 14px;
      width: 17px;
      height: 17px;
      color: #475569;
      pointer-events: none;
    }

    .auth-field__input {
      padding-left: 42px !important;
    }

    .auth-field__eye {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #475569;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }

    .auth-field__eye:hover {
      color: #0f172a;
    }

    .auth-field__error {
      font-size: 0.78rem;
      color: #e11d48;
      margin: 0;
    }

    .auth-submit {
      width: 100%;
      padding: 13px;
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .auth-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .auth-divider__line {
      flex: 1;
      height: 1px;
      background: var(--color-surface-600);
      border: none;
    }

    .auth-divider__text {
      font-size: 0.8rem;
      color: #334155;
    }

    .auth-card__footer {
      text-align: center;
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .auth-card__link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .auth-card__link:hover {
      color: #c4b5fd;
    }

    .auth-demo-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(99, 102, 241, 0.06);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 8px;
      font-size: 0.78rem;
      color: #64748b;
    }

    .auth-demo-hint code {
      background: rgba(99, 102, 241, 0.12);
      color: #4f46e5;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading   = signal(false);
  errorMsg  = signal('');
  showPassword = signal(false);
  showDemoFallback = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  startDemoMode(): void {
    this.auth.enableDemoMode();
    this.toast.success('Demo Mode activated! Explore fully with mock data.');
    this.router.navigate(['/dashboard']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please fix the errors in the form.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');
    this.showDemoFallback.set(false);

    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Welcome back, ${res.user.firstName || 'User'}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        let msg = 'Something went wrong. Please try again.';
        if (err.status === 401) {
          msg = 'Invalid email or password. Please try again.';
        } else if (err.status === 0) {
          msg = 'Cannot connect to server. Make sure the backend is running.';
          this.showDemoFallback.set(true);
        } else {
          msg = err.error?.message || msg;
        }
        this.errorMsg.set(msg);
        this.toast.error(msg);
      },
    });
  }
}
