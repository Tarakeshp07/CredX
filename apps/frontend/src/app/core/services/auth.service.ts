import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

// ── Backend-aligned types ─────────────────────────────────────────────────────

export interface UserSummary {
  id: number;
  email: string;
  role: 'STUDENT' | 'RECRUITER';
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserSummary;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'STUDENT' | 'RECRUITER';
}

// ── Storage Keys ──────────────────────────────────────────────────────────────
const TOKEN_KEY = 'credx_token';
const USER_KEY  = 'credx_user';

export const API_BASE = 'http://localhost:8080';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(this.loadToken());
  private _user  = signal<UserSummary | null>(this.loadUser());

  /** Reactive state — use these in components via computed() or directly */
  readonly isLoggedIn  = computed(() => !!this._token());
  readonly currentUser = computed(() => this._user());
  readonly token       = computed(() => this._token());

  constructor(private http: HttpClient, private router: Router) {}

  // ── Auth API calls ──────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, credentials)
      .pipe(tap((res) => this.persist(res)));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, data)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /** Returns the raw JWT string — used by the token interceptor */
  getToken(): string | null {
    return this._token();
  }

  /** Display name helper */
  getDisplayName(): string {
    const u = this._user();
    if (!u) return '';
    const full = `${u.firstName} ${u.lastName}`.trim();
    return full || u.email;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.accessToken);
    this._user.set(res.user);
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserSummary | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as UserSummary) : null;
    } catch {
      return null;
    }
  }
}
