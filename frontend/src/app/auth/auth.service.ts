import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, shareReplay, finalize } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { User, AuthResponse, Session, PendingAdmin } from '../models/api.models';
import { I18nService } from '../i18n.service';
import { Toast } from '../shared/toast.service';
import {
  getStoredToken, getStoredUser, storeAuth,
  clearStoredAuth as clearStorage, shouldRestoreSession as checkRemember,
} from '../utils/token.util';

/**
 * AuthService handles authentication concerns ONLY:
 * login, register, logout, token refresh, sessions, and admin approvals.
 *
 * For domain data (items, orders, analytics, user profile) use the
 * dedicated services in `services/`.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user = signal<User | null>(null);
  token = signal<string | null>(null);
  private refreshing$: Observable<AuthResponse> | null = null;
  private logoutInProgress = false;
  /** Resolves once the initial auth state (token restore / refresh) is settled. */
  readonly authReady: Promise<void>;
  private resolveAuthReady!: () => void;

  constructor(
    private api: ApiService,
    private router: Router,
    private i18n: I18nService,
  ) {
    this.authReady = new Promise<void>((resolve) => { this.resolveAuthReady = resolve; });
    this.loadFromStorage();
    if (!this.token() && this.shouldRestoreSession()) {
      this.refresh().subscribe({
        next: () => { this.resolveAuthReady(); },
        error: () => { this.resolveAuthReady(); },
      });
    } else {
      this.resolveAuthReady();
    }
  }

  // ── Storage helpers ──────────────────────────────────────

  private loadFromStorage(): void {
    const token = getStoredToken();
    const userStr = getStoredUser();

    if (token && this.isTokenExpired(token)) {
      this.clearStoredAuth(true);
      return;
    }

    if (token && userStr) {
      this.token.set(token);
      this.user.set(JSON.parse(userStr));
    }
  }

  private clearStoredAuth(preserveRemember = false): void {
    this.token.set(null);
    this.user.set(null);
    this.refreshing$ = null;
    clearStorage(preserveRemember);
  }

  // ── Public auth state ────────────────────────────────────

  isAuthenticated(): boolean {
    const currentToken = this.token();
    if (!currentToken) return false;
    if (this.isTokenExpired(currentToken)) {
      this.clearStoredAuth();
      return false;
    }
    return true;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }

  isBuyer(): boolean {
    return this.user()?.role === 'buyer';
  }

  shouldRestoreSession(): boolean {
    return checkRemember();
  }

  isLogoutInProgress(): boolean {
    return this.logoutInProgress;
  }

  // ── Auth endpoints ───────────────────────────────────────

  register(data: {
    email: string;
    username: string;
    password: string;
    fullname?: string;
    role?: string;
  }): Observable<AuthResponse> {
    return this.api.postWithCredentials<AuthResponse>('/auth/register', data).pipe(
      tap((res) => {
        if (res.accessToken || res.access_token || res.token) {
          this.handleAuthSuccess(res, true);
        }
      }),
    );
  }

  login(email: string, password: string, remember: boolean = false): Observable<AuthResponse> {
    return this.api.postWithCredentials<AuthResponse>('/auth/login', { email, password, rememberMe: remember })
      .pipe(tap((res) => this.handleAuthSuccess(res, remember)));
  }

  logout(reason: 'manual' | 'expired' = 'manual'): void {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;
    this.api.postWithCredentials('/auth/logout', {}).subscribe({
      next: () => this.finishLogout(reason),
      error: () => this.finishLogout(reason),
    });
  }

  refresh(): Observable<AuthResponse> {
    if (this.logoutInProgress) {
      return new Observable<AuthResponse>((subscriber) => {
        subscriber.error(new Error('Logout in progress'));
      });
    }
    const remember = this.shouldRestoreSession();
    if (this.refreshing$) return this.refreshing$;
    this.refreshing$ = this.api.postWithCredentials<AuthResponse>('/auth/refresh', { persistent: remember }).pipe(
      tap((res) => this.handleAuthSuccess(res, remember)),
      finalize(() => { this.refreshing$ = null; }),
      shareReplay(1),
    );
    return this.refreshing$;
  }

  forgotPassword(email: string): Observable<{ success?: boolean; sent?: boolean; message?: string }> {
    return this.api.post<{ success?: boolean; sent?: boolean; message?: string }>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>('/auth/reset-password', { token, newPassword });
  }

  // ── Session management ───────────────────────────────────

  getSessions(): Observable<{ tokens: Session[] }> {
    return this.api.getWithCredentials<{ tokens: Session[] }>('/auth/tokens');
  }

  getAllSessionsPaged(page: number = 1, limit: number = 25, q: string = '', email: string = '', start: string = '', end: string = '') {
    const params: Record<string, string | number> = { page, limit };
    if (q) params['q'] = q;
    if (email) params['email'] = email;
    if (start) params['start'] = start;
    if (end) params['end'] = end;
    return this.api.getWithCredentials<{ tokens: Session[], total: number }>('/auth/admin/sessions', params);
  }

  listPendingAdmins(): Observable<{ users: PendingAdmin[] }> {
    return this.api.getWithCredentials<{ users: PendingAdmin[] }>('/auth/admin/pending-admins');
  }

  approveAdmin(id: string) {
    return this.api.postWithCredentials(`/auth/admin/pending-admins/${id}/approve`, {});
  }

  rejectAdmin(id: string) {
    return this.api.postWithCredentials(`/auth/admin/pending-admins/${id}/reject`, {});
  }

  revokeSession(id: string) {
    return this.api.deleteWithCredentials(`/auth/tokens/${id}`);
  }

  revokeSessionByAdmin(id: string) {
    return this.api.deleteWithCredentials(`/auth/tokens/${id}`);
  }

  // ── User state helpers (called by UserService) ───────────

  /** Update the in-memory user signal after a profile edit. */
  setUser(user: User): void {
    this.user.set(user);
    const storage = this.shouldRestoreSession() ? localStorage : sessionStorage;
    storage.setItem('pc_user', JSON.stringify(user));
  }

  // ── Private helpers ──────────────────────────────────────

  private isTokenExpired(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return true;
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
      const payload = JSON.parse(atob(padded));
      if (!payload?.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  private handleAuthSuccess(res: AuthResponse, remember: boolean = true): void {
    const token = res.token || res.accessToken || res.access_token || '';
    if (!token || !res.user) return;
    this.token.set(token);
    this.user.set(res.user);
    storeAuth(token, JSON.stringify(res.user), remember);
  }

  private finishLogout(reason: 'manual' | 'expired'): void {
    const toastConfig: { message: string; showToast: boolean; toastType: Toast['type'] } = reason === 'expired'
      ? { message: this.i18n.t('auth.sessionExpired'), showToast: true, toastType: 'warning' }
      : { message: this.i18n.t('auth.logoutSuccess'), showToast: true, toastType: 'success' };

    this.clearStoredAuth();
    this.logoutInProgress = false;
    this.router.navigate(['/login'], { replaceUrl: true, state: toastConfig });
  }
}
