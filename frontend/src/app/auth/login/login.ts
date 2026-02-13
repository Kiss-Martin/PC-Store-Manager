import { Component, NgModule } from '@angular/core';

import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from "lucide-angular";
import { AuthService } from '../auth.service';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router, private authService: AuthService, public theme: ThemeService) {}

  login() {
  this.isLoading = true;
  this.errorMessage = '';

  this.authService.login(this.email, this.password, { email: this.email, password: this.password })
    .subscribe({
      next: (res) => {

        // BACKEND JWT TOKEN visszaadja?
        const token = res.token || res.accessToken || res.access_token;

        if (token) {
          localStorage.setItem('token', token);
        }

        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed';
        this.isLoading = false;
      }
    });
}
  goToRegister() {
    this.router.navigate(['/register']);
  }

  toggleTheme() {
    this.theme.toggle();
  }
}
