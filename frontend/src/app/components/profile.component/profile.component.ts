import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isLoading = true;
  isEditingProfile = false;

  profileForm = {
    email: '',
    username: '',
    fullname: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showPasswordModal = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    public auth: AuthService,
    public theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.auth.getMe().subscribe({
      next: (res) => {
        this.user = res.user;
        this.profileForm = {
          email: res.user.email || '',
          username: res.user.username || '',
          fullname: res.user.fullname || ''
        };
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load profile:', err);
        this.isLoading = false;
        this.showError('Failed to load profile');
      }
    });
  }

  toggleEditMode(): void {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile) {
      this.profileForm = {
        email: this.user.email || '',
        username: this.user.username || '',
        fullname: this.user.fullname || ''
      };
    }
    this.clearMessages();
  }

  updateProfile(): void {
    this.isSaving = true;
    this.clearMessages();

    this.auth.updateMe(this.profileForm).subscribe({
      next: (res) => {
        this.user = res.user;
        this.isSaving = false;
        this.isEditingProfile = false;
        this.showSuccess('Profile updated successfully!');
      },
      error: (err: any) => {
        console.error('Failed to update profile:', err);
        this.isSaving = false;
        this.showError(err.error?.error || 'Failed to update profile');
      }
    });
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.clearMessages();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.clearMessages();
  }

  changePassword(): void {
    this.clearMessages();

    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.showError('All password fields are required');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.showError('New password must be at least 6 characters');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showError('New passwords do not match');
      return;
    }

    this.isSaving = true;

    this.auth.changePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess('Password changed successfully!');
        this.closePasswordModal();
      },
      error: (err: any) => {
        console.error('Failed to change password:', err);
        this.isSaving = false;
        this.showError(err.error?.error || 'Failed to change password');
      }
    });
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  logout(): void {
    this.auth.logout();
  }
}