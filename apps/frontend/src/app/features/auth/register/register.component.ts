import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

/** Custom validator — passwords must match */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pass    = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!pass || !confirm) return null;
  return pass.value !== confirm.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">

      <!-- Background Glows -->
      <div class="auth-page__glow auth-page__glow--left"></div>
      <div class="auth-page__glow auth-page__glow--right"></div>

      <div class="auth-card glass animate-fade-in-up">

        <!-- Logo -->
        <div class="auth-card__logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;">
            <defs>
              <linearGradient id="regLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#a855f7"/>
                <stop offset="1" stop-color="#22d3ee"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#regLogoGrad)" opacity="0.2"/>
            <path d="M8 10h10a6 6 0 0 1 0 12H8" stroke="url(#regLogoGrad)" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M8 16h8" stroke="url(#regLogoGrad)" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="24" cy="22" r="1.5" fill="#22d3ee"/>
          </svg>
          <span class="auth-card__brand">Cred<span class="gradient-text">X</span></span>
        </div>

        <!-- Header -->
        <div class="auth-card__header">
          <h1 class="auth-card__title">Create your account</h1>
          <p class="auth-card__subtitle">Start matching with your dream roles today</p>
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

          <!-- Name row -->
          <div class="auth-name-row">
            <div class="auth-field">
              <label class="form-label" for="reg-first">First name</label>
              <input
                id="reg-first"
                type="text"
                formControlName="firstName"
                class="form-input"
                [class.error]="isInvalid('firstName')"
                placeholder="John"
                autocomplete="given-name"
              />
              @if (isInvalid('firstName')) {
                <p class="auth-field__error">First name is required.</p>
              }
            </div>

            <div class="auth-field">
              <label class="form-label" for="reg-last">Last name</label>
              <input
                id="reg-last"
                type="text"
                formControlName="lastName"
                class="form-input"
                [class.error]="isInvalid('lastName')"
                placeholder="Doe"
                autocomplete="family-name"
              />
              @if (isInvalid('lastName')) {
                <p class="auth-field__error">Last name is required.</p>
              }
            </div>
          </div>

          <!-- Email -->
          <div class="auth-field">
            <label class="form-label" for="reg-email">Email address</label>
            <div class="auth-field__input-wrap">
              <svg class="auth-field__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"/>
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"/>
              </svg>
              <input
                id="reg-email"
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

          <!-- Role Selector -->
          <div class="auth-field">
            <label class="form-label">I am a</label>
            <div class="role-selector">
              <button
                type="button"
                class="role-btn"
                [class.role-btn--active]="form.get('role')?.value === 'STUDENT'"
                (click)="form.get('role')?.setValue('STUDENT')"
                id="role-student"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:20px;height:20px;">
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z"/>
                </svg>
                Student
              </button>
              <button
                type="button"
                class="role-btn"
                [class.role-btn--active]="form.get('role')?.value === 'RECRUITER'"
                (click)="form.get('role')?.setValue('RECRUITER')"
                id="role-recruiter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:20px;height:20px;">
                  <path fill-rule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25ZM10 10a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V11a1 1 0 0 0-1-1Z" clip-rule="evenodd"/>
                  <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.1.645 4.378.977 6.61.977 2.233 0 4.51-.332 6.61-.977.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 0 1-9.274 0C3.985 17.585 3 16.402 3 15.055Z"/>
                </svg>
                Recruiter
              </button>
            </div>
          </div>

          <!-- Password -->
          <div class="auth-field">
            <label class="form-label" for="reg-password">Password</label>
            <div class="auth-field__input-wrap">
              <svg class="auth-field__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clip-rule="evenodd"/>
              </svg>
              <input
                id="reg-password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                class="form-input auth-field__input"
                [class.error]="isInvalid('password')"
                placeholder="Min 6 characters"
                autocomplete="new-password"
              />
              <button type="button" class="auth-field__eye" (click)="togglePassword()" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                @if (showPassword()) {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd"/></svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clip-rule="evenodd"/><path d="m10.748 13.93 2.523 2.524a10.002 10.002 0 0 1-8.545-3.949 1.651 1.651 0 0 1-.026-1.187 10.06 10.06 0 0 1 1.51-2.498l1.086 1.085a4 4 0 0 0 3.452 3.525Z"/></svg>
                }
              </button>
            </div>

            <!-- Password Strength -->
            @if (form.get('password')?.value) {
              <div class="password-strength">
                <div class="password-strength__bars">
                  @for (i of [1,2,3,4]; track i) {
                    <div
                      class="password-strength__bar"
                      [class.password-strength__bar--filled]="passwordStrength() >= i"
                      [style.background]="getStrengthColor()"
                    ></div>
                  }
                </div>
                <span class="password-strength__label" [style.color]="getStrengthColor()">
                  {{ getStrengthLabel() }}
                </span>
              </div>
            }

            @if (isInvalid('password')) {
              <p class="auth-field__error">Password must be at least 6 characters.</p>
            }
          </div>

          <!-- Confirm Password -->
          <div class="auth-field">
            <label class="form-label" for="reg-confirm">Confirm password</label>
            <div class="auth-field__input-wrap">
              <svg class="auth-field__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clip-rule="evenodd"/>
              </svg>
              <input
                id="reg-confirm"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                class="form-input auth-field__input"
                [class.error]="showMismatch()"
                placeholder="Repeat password"
                autocomplete="new-password"
              />
            </div>
            @if (showMismatch()) {
              <p class="auth-field__error">Passwords do not match.</p>
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
              Creating account…
            } @else {
              Create account
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
              </svg>
            }
          </button>

        </form>

        <!-- Footer -->
        <p class="auth-card__footer">
          Already have an account?
          <a routerLink="/login" class="auth-card__link">Sign in →</a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
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
      right: -150px;
      top: -100px;
      background: radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%);
    }

    .auth-page__glow--right {
      left: -150px;
      bottom: -100px;
      background: radial-gradient(circle, rgba(124,111,247,0.12) 0%, transparent 70%);
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 20px;
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
      gap: 16px;
    }

    .auth-name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .auth-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
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

    /* Role Selector */
    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .role-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #ffffff;
      border: 1px solid var(--color-surface-600);
      border-radius: 10px;
      color: #475569;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .role-btn:hover {
      border-color: rgba(99,102,241,0.4);
      color: #4f46e5;
      background: rgba(99,102,241,0.04);
    }

    .role-btn--active {
      background: rgba(99,102,241,0.1);
      border-color: #6366f1;
      color: #4f46e5;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(99,102,241,0.15);
    }

    /* Password Strength */
    .password-strength {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }

    .password-strength__bars {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    .password-strength__bar {
      flex: 1;
      height: 3px;
      border-radius: 2px;
      background: var(--color-surface-600);
      transition: background 0.3s ease;
    }

    .password-strength__label {
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
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

    @media (max-width: 400px) {
      .auth-name-row { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading      = signal(false);
  errorMsg     = signal('');
  showPassword = signal(false);
  showDemoFallback = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        firstName:       ['', Validators.required],
        lastName:        ['', Validators.required],
        email:           ['', [Validators.required, Validators.email]],
        role:            ['STUDENT'],
        password:        ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  showMismatch(): boolean {
    const confirm = this.form.get('confirmPassword');
    return !!(
      this.form.hasError('passwordMismatch') &&
      confirm?.touched
    );
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  passwordStrength(): number {
    const pw = this.form.get('password')?.value || '';
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  getStrengthColor(): string {
    const s = this.passwordStrength();
    if (s <= 1) return '#f43f5e';
    if (s === 2) return '#f59e0b';
    if (s === 3) return '#22c55e';
    return '#22d3ee';
  }

  getStrengthLabel(): string {
    const s = this.passwordStrength();
    if (s <= 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
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

    const { confirmPassword, ...payload } = this.form.value;

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Account created! Welcome, ${res.user.firstName || 'User'}!`);
        this.router.navigate(['/profile']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        let msg = 'Something went wrong. Please try again.';
        if (err.status === 409) {
          msg = 'This email is already registered. Try signing in instead.';
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
