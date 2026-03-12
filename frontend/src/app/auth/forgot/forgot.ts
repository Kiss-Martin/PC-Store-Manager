import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../auth.service';
import { ToastService } from '../../shared/toast.service';
import { ThemeService } from '../../theme.service';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './forgot.html',
  styleUrls: ['./forgot.css'],
})
export class ForgotComponent {
  email = '';
  isLoading = false;
  message = '';
  sent = false;


  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    public theme: ThemeService,
    public i18n: I18nService,
  ) {}

  sendReset(): void {
    if (!this.email) {
      this.message = this.i18n.t('forgot.error.enterEmail');
      return;
    }
    this.isLoading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Always show non-disclosive message
        if (res && res.sent) {
          this.sent = true;
          this.message = res.message || this.i18n.t('forgot.success.sent');
          // show toast and redirect after short delay
          try { this.toast.show(this.message, { type: 'success', timeout: 3000 }); } catch (e) {}
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          // backend didn't send (either no SMTP) — still show generic message
          this.sent = false;
          this.message = res?.message || this.i18n.t('forgot.info.generic');
          this.toast.show(this.message, { type: 'info', timeout: 4000 });
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.message = err?.error?.message || this.i18n.t('forgot.error.failed');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    this.theme.toggle();
  }

  toggleLanguage() {
    this.i18n.toggleLanguage();
  }
}
