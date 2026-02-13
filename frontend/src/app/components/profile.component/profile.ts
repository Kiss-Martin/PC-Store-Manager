import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [LucideAngularModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  user: any;
  isEditing = false;
  editData: any = {};

  constructor(private auth: AuthService, private router: Router) {
    this.user = this.auth.getUser();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
  
  startEdit() {
    this.editData = {
      fullname: this.user?.fullname || '',
      username: this.user?.username || '',
      email: this.user?.email || ''
    };
    this.isEditing = true;
  }

  saveEdit() {
    // send changes to backend, fallback to local update on error
    this.auth.updateProfile(this.editData).subscribe({
      next: (res: any) => {
        if (res && res.user) this.user = res.user;
        this.isEditing = false;
      },
      error: () => {
        // fallback local merge
        this.user = { ...this.user, ...this.editData };
        try {
          const stored = JSON.parse(localStorage.getItem('pc_user') || 'null') || {};
          const merged = { ...stored, ...this.user };
          localStorage.setItem('pc_user', JSON.stringify(merged));
        } catch {
          localStorage.setItem('pc_user', JSON.stringify(this.user));
        }
        this.isEditing = false;
      }
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editData = {};
  }
  
  get roleIcon(): string {
    const r = (this.user?.role || '').toString().toLowerCase();
    if (r.includes('admin')) return 'briefcase';
    return 'user';
  }
}
