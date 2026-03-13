import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = (environment.apiUrl || '').replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  private build(path: string) {
    if (!path) return this.base;
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  get<T>(path: string, params?: any) {
    return this.http.get<T>(this.build(path), { params });
  }

  post<T>(path: string, body?: any) {
    return this.http.post<T>(this.build(path), body);
  }

  postFormData<T>(path: string, form: FormData, withCredentials: boolean = false) {
    return this.http.post<T>(this.build(path), form, { withCredentials });
  }

  // Convenience helpers for requests that require sending/receiving httpOnly cookies (withCredentials)
  postWithCredentials<T>(path: string, body?: any) {
    return this.http.post<T>(this.build(path), body, { withCredentials: true });
  }

  getWithCredentials<T>(path: string, params?: any) {
    return this.http.get<T>(this.build(path), { params, withCredentials: true });
  }

  deleteWithCredentials<T>(path: string) {
    return this.http.delete<T>(this.build(path), { withCredentials: true });
  }

  patch<T>(path: string, body?: any) {
    return this.http.patch<T>(this.build(path), body);
  }

  delete<T>(path: string) {
    return this.http.delete<T>(this.build(path));
  }

  getBlob(path: string, params?: any): Observable<Blob> {
    // HttpClient's overload that returns Blob uses responseType: 'blob'
    return this.http.get(this.build(path), { params, responseType: 'blob' }) as Observable<Blob>;
  }
}
