import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from "lucide-angular";
import { AuthService } from '../auth.service';
import { ThemeService } from '../../theme.service';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';
import { ToastService } from '../../shared/toast.service';
import { Toast } from '../../shared/toast.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  isLoading = false;

  // Contact support modal
  showContactModal = false;
  contactName = '';
  contactEmail = '';
  contactMessage = '';
  contactLoading = false;

  constructor(private router: Router, private authService: AuthService, private api: ApiService, private toast: ToastService, public theme: ThemeService, public i18n: I18nService) {
    const message = history.state?.message || '';
    if (message) {
      const toastType = (history.state?.toastType || (history.state?.showToast ? 'success' : 'info')) as Toast['type'];
      this.toast.show(message, { type: toastType, timeout: 3000 });
    }
  }

  login() {
    if (!this.email || !this.password) {
      this.toast.show(this.i18n.t('login.error.missingCredentials'), { type: 'error', timeout: 3000 });
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email, this.password, this.rememberMe).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.toast.show(err.error?.error || this.i18n.t('login.error.failed'), { type: 'error', timeout: 3500 });
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgot() {
    this.router.navigate(['/forgot']);
  }

  openContactModal() {
    this.contactName = '';
    this.contactEmail = '';
    this.contactMessage = '';
    this.contactLoading = false;
    this.showContactModal = true;
  }

  closeContactModal() {
    this.showContactModal = false;
  }

  submitContactSupport() {
    if (!this.contactMessage.trim()) {
      this.toast.show(this.i18n.t('login.contactModal.errorEmpty'), { type: 'warning', timeout: 3000 });
      return;
    }
    this.contactLoading = true;
    this.api.post<{ success: boolean; message?: string }>('/support/contact', {
      name: this.contactName.trim() || undefined,
      email: this.contactEmail.trim() || undefined,
      message: this.contactMessage.trim(),
    }).subscribe({
      next: () => {
        this.contactLoading = false;
        this.showContactModal = false;
        this.toast.show(this.i18n.t('login.contactModal.success'), { type: 'success', timeout: 5000 });
      },
      error: () => {
        this.contactLoading = false;
        this.toast.show(this.i18n.t('login.contactModal.error'), { type: 'error', timeout: 4000 });
      },
    });
  }

  toggleTheme() {
    this.theme.toggle();
  }

  toggleLanguage() {
    this.i18n.toggleLanguage();
  }
}
