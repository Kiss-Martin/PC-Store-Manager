import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private ApiUrl = 'https://pc-store-manager.onrender.com';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('pc_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  register(data: {
    email: string;
    username: string;
    password: string;
    fullname: string;
    role: string;
  }): Observable<any> {
    return this.http.post(`${this.ApiUrl}/auth/register`, data);
  }

  login(
    email: string,
    password: string,
    data: { email: string; password: string },
  ): Observable<any> {
    return this.http.post(`${this.ApiUrl}/auth/login`, data).pipe(
      tap((res: any) => {
        if (res && res.token) {
          localStorage.setItem('pc_token', res.token);
          const user = res.user || { email };
          localStorage.setItem('pc_user', JSON.stringify(user));
        }
      }),
    );
  }

  logout() {
    localStorage.removeItem('pc_token');
    localStorage.removeItem('pc_user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('pc_token');
  }

  getUser(): any {
    try {
      return JSON.parse(localStorage.getItem('pc_user') || 'null');
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const u = this.getUser();
    return !!(u && (u.role === 'admin' || u.role === 'Administrator'));
  }

  updateProfile(data: { fullname?: string; username?: string; email?: string }): Observable<any> {
    return this.http.patch(`${this.ApiUrl}/me`, data, { headers: this.getHeaders() }).pipe(
      tap((res: any) => {
        if (res && res.user) {
          localStorage.setItem('pc_user', JSON.stringify(res.user));
        }
      }),
    );
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.ApiUrl}/dashboard`, { headers: this.getHeaders() });
  }

  // Products CRUD
  getItems(): Observable<any> {
    return this.http.get(`${this.ApiUrl}/items`);
  }

  createItem(item: any): Observable<any> {
    return this.http.post(`${this.ApiUrl}/items`, item, { headers: this.getHeaders() });
  }

  updateItem(id: string, item: any): Observable<any> {
    return this.http.patch(`${this.ApiUrl}/items/${id}`, item, { headers: this.getHeaders() });
  }

  deleteItem(id: string): Observable<any> {
    return this.http.delete(`${this.ApiUrl}/items/${id}`, { headers: this.getHeaders() });
  }

  // ✅ Analytics endpoints
  getAnalytics(period: string = '7days'): Observable<any> {
    return this.http.get(`${this.ApiUrl}/analytics?period=${period}`, {
      headers: this.getHeaders(),
    });
  }

  exportAnalytics(period: string = '7days'): Observable<Blob> {
    return this.http.get(`${this.ApiUrl}/analytics/export?period=${period}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }
  getOrders(): Observable<any> {
    return this.http.get(`${this.ApiUrl}/orders`, { headers: this.getHeaders() });
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.patch(
      `${this.ApiUrl}/orders/${orderId}/status`,
      { status },
      { headers: this.getHeaders() },
    );
  }

  exportOrders(status: string = 'all'): Observable<Blob> {
    return this.http.get(`${this.ApiUrl}/orders/export?status=${status}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }
}
