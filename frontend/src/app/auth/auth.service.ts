import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})


export class AuthService {
  private ApiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  register(data:{
    email: string;
    username: string;
    password: string;
    fullname: string;
    role: string;
  }): Observable<any> {
    return this.http.post(`${this.ApiUrl}/auth/register`, data);
  }

  login(email: string, password: string, data: { email: string; password: string; }): Observable<any> {
    return this.http.post(`${this.ApiUrl}/auth/login`, data).pipe(
      tap((res: any) => {
        if (res && res.token) {
          localStorage.setItem('pc_token', res.token);
          // store user info if returned by backend, otherwise store at least email
          const user = res.user || { email };
          localStorage.setItem('pc_user', JSON.stringify(user));
        }
      })
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
    return this.http.patch(`${this.ApiUrl}/me`, data).pipe(
      tap((res: any) => {
        if (res && res.user) {
          localStorage.setItem('pc_user', JSON.stringify(res.user));
        }
      })
    );
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.ApiUrl}/dashboard`);
  }
}