import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme.service';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
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
    public theme: ThemeService,
    public i18n: I18nService,
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
        this.showError(err.error?.error || this.i18n.t('profile.error.load'));
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
        this.showSuccess(this.i18n.t('profile.success.updated'));
      },
      error: (err: any) => {
        console.error('Failed to update profile:', err);
        this.isSaving = false;
        this.showError(err.error?.error || this.i18n.t('profile.error.update'));
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
      this.showError(this.i18n.t('profile.error.allPasswordFields'));
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.showError(this.i18n.t('profile.error.newPasswordLength'));
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showError(this.i18n.t('profile.error.newPasswordMismatch'));
      return;
    }

    this.isSaving = true;

    this.auth.changePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess(this.i18n.t('profile.success.passwordChanged'));
        this.closePasswordModal();
      },
      error: (err: any) => {
        console.error('Failed to change password:', err);
        this.isSaving = false;
        this.showError(err.error?.error || this.i18n.t('profile.error.changePassword'));
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

  getRoleLabel(role: string | undefined): string {
    if (role === 'admin') return this.i18n.t('role.admin');
    if (role === 'worker') return this.i18n.t('role.worker');
    return this.i18n.t('role.user');
  }
}
