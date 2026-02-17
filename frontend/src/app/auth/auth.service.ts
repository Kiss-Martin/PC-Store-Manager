import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface User {
  id: string;
  email: string;
  username: string;
  fullname?: string;
  role: string;
}

interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string;
  access_token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private ApiUrl = 'https://pc-store-manager.onrender.com';
  
  user = signal<User | null>(null);
  token = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      this.token.set(token);
      this.user.set(JSON.parse(userStr));
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.token();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
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
  register(data: { email: string; username: string; password: string; fullname?: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.ApiUrl}/auth/register`, data).pipe(
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.ApiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  logout(): void {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    const token = res.token || res.accessToken || res.access_token || '';
    this.token.set(token);
    this.user.set(res.user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  // Profile endpoints
  getMe(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.ApiUrl}/me`, { 
      headers: this.getHeaders() 
    }).pipe(
      tap((res) => this.user.set(res.user))
    );
  }

  updateMe(data: { email?: string; username?: string; fullname?: string }): Observable<{ user: User }> {
    return this.http.patch<{ user: User }>(`${this.ApiUrl}/me`, data, { 
      headers: this.getHeaders() 
    }).pipe(
      tap((res) => {
        this.user.set(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(
      `${this.ApiUrl}/me/password`,
      { currentPassword, newPassword },
      { headers: this.getHeaders() }
    );
  }

  // Items/Products endpoints
  getItems(): Observable<{ items: any[] }> {
    return this.http.get<{ items: any[] }>(`${this.ApiUrl}/items`, { 
      headers: this.getHeaders() 
    });
  }

  createItem(item: any): Observable<{ success: boolean; item: any }> {
    return this.http.post<{ success: boolean; item: any }>(
      `${this.ApiUrl}/items`,
      item,
      { headers: this.getHeaders() }
    );
  }

  updateItem(id: string, item: any): Observable<{ item: any }> {
    return this.http.patch<{ item: any }>(
      `${this.ApiUrl}/items/${id}`,
      item,
      { headers: this.getHeaders() }
    );
  }

  deleteItem(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.ApiUrl}/items/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Categories endpoints
  getCategories(): Observable<{ categories: any[] }> {
    return this.http.get<{ categories: any[] }>(`${this.ApiUrl}/categories`, { 
      headers: this.getHeaders() 
    });
  }

  // Brands endpoints
  getBrands(): Observable<{ brands: any[] }> {
    return this.http.get<{ brands: any[] }>(`${this.ApiUrl}/brands`, { 
      headers: this.getHeaders() 
    });
  }

  // Orders endpoints
  getOrders(): Observable<{ orders: any[] }> {
    return this.http.get<{ orders: any[] }>(`${this.ApiUrl}/orders`, { 
      headers: this.getHeaders() 
    });
  }

  updateOrderStatus(id: string, status: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(
      `${this.ApiUrl}/orders/${id}/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }

  exportOrders(status: string = 'all'): Observable<Blob> {
    return this.http.get(
      `${this.ApiUrl}/orders/export?status=${status}`,
      { 
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    );
  }

  // Dashboard endpoint
  getDashboard(): Observable<any> {
    return this.http.get(`${this.ApiUrl}/dashboard`, { 
      headers: this.getHeaders() 
    });
  }

  // Analytics endpoint
  getAnalytics(period: string = '7days'): Observable<any> {
    return this.http.get(`${this.ApiUrl}/analytics?period=${period}`, { 
      headers: this.getHeaders() 
    });
  }

  getCustomers(): Observable<{ customers: any[] }> {
    return this.http.get<{ customers: any[] }>(`${this.ApiUrl}/customers`, { 
      headers: this.getHeaders() 
    });
  }

  createCustomer(customer: { name: string; email?: string; phone?: string }): Observable<{ success: boolean; customer: any }> {
    return this.http.post<{ success: boolean; customer: any }>(
      `${this.ApiUrl}/customers`,
      customer,
      { headers: this.getHeaders() }
    );
  }

  // Create manual order
  createOrder(order: { item_id: string; customer_id: string; quantity: number }): Observable<{ success: boolean; order: any }> {
    return this.http.post<{ success: boolean; order: any }>(
      `${this.ApiUrl}/orders`,
      order,
      { headers: this.getHeaders() }
    );
  }

  exportAnalytics(period: string = '7days'): Observable<Blob> {
    return this.http.get(
      `${this.ApiUrl}/analytics/export?period=${period}`,
      { 
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    );
  }
}