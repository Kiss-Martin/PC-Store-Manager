import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { User, AuthResponse } from '../models/api.models';

export type ExportFormat = 'csv' | 'pdf';

// Use shared models from `api.models`

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // ApiService handles base URL normalization

  user = signal<User | null>(null);
  token = signal<string | null>(null);

  constructor(
    private api: ApiService,
    private router: Router,
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('pc_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      this.token.set(token);
      this.user.set(JSON.parse(userStr));
    }
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }

  // Auth endpoints
  register(data: {
    email: string;
    username: string;
    password: string;
    fullname?: string;
    role?: string;
  }): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  logout(): void {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('pc_token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    const token = res.token || res.accessToken || res.access_token || '';
    this.token.set(token);
    this.user.set(res.user);
    // store token under both keys for compatibility with interceptor
    localStorage.setItem('token', token);
    localStorage.setItem('pc_token', token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  // Profile endpoints
  getMe(): Observable<{ user: User }> {
    return this.api.get<{ user: User }>('/users/me').pipe(tap((res) => this.user.set(res.user)));
  }

  updateMe(data: {
    email?: string;
    username?: string;
    fullname?: string;
  }): Observable<{ user: User }> {
    return this.api.patch<{ user: User }>('/users/me', data).pipe(
      tap((res) => {
        this.user.set(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
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
  getItems(): Observable<{ items: any[] }> {
    return this.api.get<{ items: any[] }>('/items');
  }

  createItem(item: any): Observable<{ success: boolean; item: any }> {
    const payload = {
      ...item,
      specs: item.specifications ?? item.specs ?? '',
    };
    delete payload.specifications;
    return this.api.post<{ success: boolean; item: any }>('/items', payload);
  }

  updateItem(id: string, item: any): Observable<{ item: any }> {
    const payload = {
      ...item,
      specs: item.specifications ?? item.specs ?? '',
    };
    delete payload.specifications;
    return this.api.patch<{ item: any }>(`/items/${id}`, payload);
  }

  deleteItem(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/items/${id}`);
  }

  // Categories endpoints
  getCategories(): Observable<{ categories: any[] }> {
    return this.api.get<{ categories: any[] }>('/items/categories');
  }

  // Brands endpoints
  getBrands(): Observable<{ brands: any[] }> {
    return this.api.get<{ brands: any[] }>('/items/brands');
  }

  // Orders endpoints
  getOrders(): Observable<{ orders: any[] }> {
    return this.api.get<{ orders: any[] }>('/orders');
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
  getDashboard(): Observable<any> {
    return this.api.get('/dashboard');
  }

  // Analytics endpoint
  getAnalytics(period: string = '7days'): Observable<any> {
    return this.api.get(`/analytics?period=${period}`);
  }

  getCustomers(): Observable<{ customers: any[] }> {
    return this.api.get<{ customers: any[] }>('/customers');
  }

  createCustomer(customer: {
    name: string;
    email?: string;
    phone?: string;
  }): Observable<{ success: boolean; customer: any }> {
    return this.api.post<{ success: boolean; customer: any }>('/customers', customer);
  }

  // Create manual order
  createOrder(order: {
    item_id: string;
    customer_id: string;
    quantity: number;
  }): Observable<{ success: boolean; order: any }> {
    return this.api.post<{ success: boolean; order: any }>('/orders', order);
  }

  generateBusinessReport(period: string = '7days', format: ExportFormat = 'csv'): Observable<Blob> {
    return this.api.getBlob('/analytics/export', { period, format });
  }

  // Get workers for assignment
  getWorkers(): Observable<{ users: any[] }> {
    return this.api.get<{ users: any[] }>('/users/workers');
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
}
