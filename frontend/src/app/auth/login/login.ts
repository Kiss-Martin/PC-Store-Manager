import { Component, NgModule } from '@angular/core';

import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from "lucide-angular";
import { AuthService } from '../auth.service';
import { ThemeService } from '../../theme.service';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router, private authService: AuthService, public theme: ThemeService, public i18n: I18nService) {}

  login() {
  if (!this.email || !this.password) {
    this.errorMessage = this.i18n.t('login.error.missingCredentials');
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.authService.login(this.email, this.password).subscribe({
    next: () => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    },
    error: (err: any) => {
      this.isLoading = false;
      this.errorMessage = err.error?.error || this.i18n.t('login.error.failed');
    }
  });
}

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgot() {
    this.router.navigate(['/forgot']);
  }

  toggleTheme() {
    this.theme.toggle();
  }

  toggleLanguage() {
    this.i18n.toggleLanguage();
  }
}
