import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  getMe(): Observable<{ user: User }> {
    return this.api.get<{ user: User }>('/users/me');
  }

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
    return this.api.patch<{ user: User }>('/users/me', data);
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

  deleteMe(): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>('/users/me');
  }
}
