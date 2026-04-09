import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../theme.service';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';
import { ToastService } from '../../shared/toast.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  success = false;
  error = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
    public theme: ThemeService,
    public i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = this.i18n.t('resetPassword.error.missingToken');
    }
  }

  submit(): void {
    this.error = '';
    if (!this.newPassword || this.newPassword.length < 8) {
      this.error = this.i18n.t('resetPassword.error.passwordLength');
      return;
    }
    const pw = this.newPassword;
    if (!/[A-Z]/.test(pw)) { this.error = this.i18n.t('register.error.passwordUppercase'); return; }
    if (!/[a-z]/.test(pw)) { this.error = this.i18n.t('register.error.passwordLowercase'); return; }
    if (!/[0-9]/.test(pw)) { this.error = this.i18n.t('register.error.passwordDigit'); return; }
    if (!/[^A-Za-z0-9]/.test(pw)) { this.error = this.i18n.t('register.error.passwordSpecial'); return; }
    if (this.newPassword !== this.confirmPassword) {
      this.error = this.i18n.t('resetPassword.error.passwordMismatch');
      return;
    }
    this.isLoading = true;
    this.api.post<{ success: boolean }>('/auth/reset-password', {
      token: this.token,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.success = true;
        this.toast.show(this.i18n.t('resetPassword.success'), { type: 'success', timeout: 4000 });
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = err.error?.error || this.i18n.t('resetPassword.error.failed');
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }
}
