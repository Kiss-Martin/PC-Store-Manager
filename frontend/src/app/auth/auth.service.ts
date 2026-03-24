import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, shareReplay, finalize } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { User, AuthResponse, Item, Category, Brand, Customer, Order, Session, AnalyticsSummary, TopProduct, Transaction, DashboardStats, DashboardActivity, PendingAdmin } from '../models/api.models';
import { I18nService } from '../i18n.service';
import { Toast } from '../shared/toast.service';

export type ExportFormat = 'csv' | 'pdf';

// Use shared models from `api.models`

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // ApiService handles base URL normalization
  private readonly rememberKey = 'pc_remember';

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
    // Only restore after reopen when the user explicitly chose to remain signed in
    if (!this.token() && this.shouldRestoreSession()) {
      // attempt refresh; once settled the auth state is ready
      this.refresh().subscribe({
        next: () => { this.resolveAuthReady(); },
        error: () => { this.resolveAuthReady(); },
      });
    } else {
      this.resolveAuthReady();
    }
  }

  private loadFromStorage(): void {
    // Prefer long-lived token in localStorage, otherwise check sessionStorage
    const token = localStorage.getItem('pc_token') || localStorage.getItem('token') || sessionStorage.getItem('pc_token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (token && this.isTokenExpired(token)) {
      // Token expired – clear auth data but KEEP the rememberKey so
      // the constructor can still attempt a refresh via the httpOnly cookie.
      this.clearStoredAuth(/* preserveRemember */ true);
      return;
    }

    if (token && userStr) {
      this.token.set(token);
      this.user.set(JSON.parse(userStr));
    }
  }

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
    return localStorage.getItem(this.rememberKey) === 'true';
  }

  // Auth endpoints
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
    return this.api.postWithCredentials<AuthResponse>('/auth/login', { email, password, rememberMe: remember }).pipe(tap((res) => this.handleAuthSuccess(res, remember)));
  }

  logout(reason: 'manual' | 'expired' = 'manual'): void {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;
    // Tell backend to revoke refresh token and clear cookie
    this.api.postWithCredentials('/auth/logout', {}).subscribe({
      next: () => {
        this.finishLogout(reason);
      },
      error: () => {
        this.finishLogout(reason);
      },
    });
  }

  // Try to refresh access token using httpOnly refresh cookie
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

  private clearStoredAuth(preserveRemember = false): void {
    this.token.set(null);
    this.user.set(null);
    this.refreshing$ = null;
    localStorage.removeItem('token');
    localStorage.removeItem('pc_token');
    localStorage.removeItem('user');
    if (!preserveRemember) localStorage.removeItem(this.rememberKey);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('pc_token');
    sessionStorage.removeItem('user');
  }

  isLogoutInProgress(): boolean {
    return this.logoutInProgress;
  }

  private finishLogout(reason: 'manual' | 'expired'): void {
    const toastConfig: { message: string; showToast: boolean; toastType: Toast['type'] } = reason === 'expired'
      ? {
          message: this.i18n.t('auth.sessionExpired'),
          showToast: true,
          toastType: 'warning',
        }
      : {
          message: this.i18n.t('auth.logoutSuccess'),
          showToast: true,
          toastType: 'success',
        };

    this.clearStoredAuth();
    this.logoutInProgress = false;
    this.router.navigate(['/login'], {
      replaceUrl: true,
      state: toastConfig,
    });
  }

  // Sessions (active refresh tokens) for current user
  getSessions(): Observable<{ tokens: Session[] }> {
    return this.api.getWithCredentials<{ tokens: Session[] }>('/auth/tokens');
  }

  // Admin: list all sessions across users
  getAllSessions(): Observable<{ tokens: Session[] }> {
    return this.api.getWithCredentials<{ tokens: Session[] }>('/auth/admin/sessions');
  }

  getAllSessionsPaged(page: number = 1, limit: number = 25, q: string = '', email: string = '', start: string = '', end: string = '') {
    const params: Record<string, string | number> = { page, limit };
    if (q) params['q'] = q;
    if (email) params['email'] = email;
    if (start) params['start'] = start;
    if (end) params['end'] = end;
    return this.api.getWithCredentials<{ tokens: Session[], total: number }>('/auth/admin/sessions', params);
  }

  // Admin: pending admin approvals
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

  // Admin revoke (same endpoint but used by admin UI)
  revokeSessionByAdmin(id: string) {
    return this.api.deleteWithCredentials(`/auth/tokens/${id}`);
  }

  private handleAuthSuccess(res: AuthResponse, remember: boolean = true): void {
    const token = res.token || res.accessToken || res.access_token || '';
    if (!token || !res.user) return;
    this.token.set(token);
    this.user.set(res.user);
    // store token under both keys for compatibility with interceptor
    // when remember==true use localStorage (persist across sessions), otherwise use sessionStorage
    if (remember) {
      localStorage.setItem('token', token);
      localStorage.setItem('pc_token', token);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem(this.rememberKey, 'true');
      // remove any sessionStorage values
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('pc_token');
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('pc_token', token);
      sessionStorage.setItem('user', JSON.stringify(res.user));
      // remove any localStorage values to avoid ambiguity
      localStorage.removeItem('token');
      localStorage.removeItem('pc_token');
      localStorage.removeItem('user');
      localStorage.removeItem(this.rememberKey);
    }
  }

  // Profile endpoints
  getMe(): Observable<{ user: User }> {
    return this.api.get<{ user: User }>('/users/me').pipe(tap((res) => this.user.set(res.user)));
  }

  // Avatar endpoints
  getMyAvatar(): Observable<Blob> {
    return this.api.getBlob('/users/me/avatar');
  }

  uploadAvatar(file: File): Observable<{ success: boolean; message: string }> {
    const fd = new FormData();
    fd.append('avatar', file, file.name);
    return this.api.postFormData<{ success: boolean; message: string }>('/users/me/avatar', fd, true);
  }

  updateMe(data: {
    email?: string;
    username?: string;
    fullname?: string;
  }): Observable<{ user: User }> {
    return this.api.patch<{ user: User }>('/users/me', data).pipe(
      tap((res) => {
        this.user.set(res.user);
        const storage = this.shouldRestoreSession() ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(res.user));
      }),
    );
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Observable<{ success: boolean; message: string }> {
    return this.api.patch<{ success: boolean; message: string }>('/users/me/password', {
      currentPassword,
      newPassword,
    });
  }

  // Items/Products endpoints
  getItems(): Observable<{ items: Item[] }> {
    return this.api.get<{ items: Item[] }>('/items');
  }

  createItem(item: Partial<Item>): Observable<{ success: boolean; item: Item }> {
    const payload = { ...item } as Record<string, unknown>;
    delete payload['specifications'];
    delete payload['specs'];
    return this.api.post<{ success: boolean; item: Item }>('/items', payload);
  }

  updateItem(id: string, item: Partial<Item>): Observable<{ item: Item }> {
    const payload = { ...item } as Record<string, unknown>;
    delete payload['specifications'];
    delete payload['specs'];
    return this.api.patch<{ item: Item }>(`/items/${id}`, payload);
  }

  deleteItem(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/items/${id}`);
  }

  // Categories endpoints
  getCategories(): Observable<{ categories: Category[] }> {
    return this.api.get<{ categories: Category[] }>('/items/categories');
  }

  // Brands endpoints
  getBrands(): Observable<{ brands: Brand[] }> {
    return this.api.get<{ brands: Brand[] }>('/items/brands');
  }

  // Orders endpoints
  getOrders(): Observable<{ orders: Order[] }> {
    return this.api.get<{ orders: Order[] }>('/orders');
  }

  updateOrderStatus(id: string, status: string): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>(`/orders/${id}/status`, { status });
  }

  deleteOrder(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/orders/${id}`);
  }

  exportOrders(status: string = 'all', format: ExportFormat = 'csv'): Observable<Blob> {
    return this.api.getBlob('/orders/export', { status, format });
  }

  // Dashboard endpoint
  getDashboard(): Observable<{ stats: DashboardStats; activities: DashboardActivity[] }> {
    return this.api.get<{ stats: DashboardStats; activities: DashboardActivity[] }>('/dashboard');
  }

  // Analytics endpoint
  getAnalytics(period: string = '7days'): Observable<{
    summary: AnalyticsSummary;
    revenueChart?: { labels: string[]; data: number[] };
    categoryChart?: { labels: string[]; data: number[] };
    topProducts: TopProduct[];
    recentTransactions?: Transaction[];
  }> {
    return this.api.get(`/analytics?period=${period}`);
  }

  getCustomers(): Observable<{ customers: Customer[] }> {
    return this.api.get<{ customers: Customer[] }>('/customers');
  }

  createCustomer(customer: {
    name: string;
    email?: string;
    phone?: string;
  }): Observable<{ success: boolean; customer: Customer }> {
    return this.api.post<{ success: boolean; customer: Customer }>('/customers', customer);
  }

  // Create manual order
  createOrder(order: {
    item_id: string;
    customer_id: string;
    quantity: number;
  }): Observable<{ success: boolean; order: Order }> {
    return this.api.post<{ success: boolean; order: Order }>('/orders', order);
  }

  generateBusinessReport(period: string = '7days', format: ExportFormat = 'csv'): Observable<Blob> {
    return this.api.getBlob('/analytics/export', { period, format });
  }

  // Get workers for assignment
  getWorkers(): Observable<{ users: User[] }> {
    return this.api.get<{ users: User[] }>('/users/workers');
  }

  // Assign order to worker
  assignOrder(orderId: string, userId: string | null): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>(`/orders/${orderId}/assign`, { assigned_to: userId });
  }

  exportAnalytics(period: string = '7days', format: ExportFormat = 'csv'): Observable<Blob> {
    return this.api.getBlob('/analytics/export', { period, format });
  }

  // Password reset initiation
  forgotPassword(email: string): Observable<{ success?: boolean; sent?: boolean; message?: string }> {
    return this.api.post<{ success?: boolean; sent?: boolean; message?: string }>('/auth/forgot-password', { email });
  }

  // Password reset completion
  resetPassword(token: string, newPassword: string): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>('/auth/reset-password', { token, newPassword });
  }
}
