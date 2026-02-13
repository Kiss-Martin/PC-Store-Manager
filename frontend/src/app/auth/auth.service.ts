import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
    return this.http.post(`${this.ApiUrl}/auth/login`, data);
  }
}