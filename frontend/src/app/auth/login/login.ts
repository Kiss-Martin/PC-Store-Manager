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
  if (!this.email || !this.password) {
    this.errorMessage = 'Please enter both email and password';
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
      this.errorMessage = err.error?.error || 'Login failed';
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
