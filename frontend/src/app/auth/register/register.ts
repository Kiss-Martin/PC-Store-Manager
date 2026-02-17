import { Component, NgModule } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from "lucide-angular";
import { ThemeService } from '../../theme.service';

interface RegistrationData {
  icon: string;
  role: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  fullName: string;
}

@Component({
  selector: 'app-register',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  currentStep = 1;
  totalSteps = 4;

  formData: RegistrationData = {
    role: '',
    icon: 'user',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: ''
  };

  errors: { [key: string]: string } = {};
  isLoading = false;

  constructor(private router: Router, private authService: AuthService, public theme: ThemeService) {}

  get progressPercentage() {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  validateStep(step: number): boolean {
    this.errors = {};

    if (step === 1) {
      if (!this.formData.role) {
        this.errors['role'] = 'Please select a role';
        return false;
      }
    } else if (step === 2) {
      if (!this.formData.username || this.formData.username.length < 3) {
        this.errors['username'] = 'Username must be at least 3 characters';
      }
      if (!this.formData.password || this.formData.password.length < 6) {
        this.errors['password'] = 'Password must be at least 6 characters';
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errors['confirmPassword'] = 'Passwords do not match';
      }
      return Object.keys(this.errors).length === 0;
    } else if (step === 3) {
      if (!this.formData.fullName) {
        this.errors['fullName'] = 'Full name is required';
      }
      if (!this.formData.email || !this.isValidEmail(this.formData.email)) {
        this.errors['email'] = 'Please enter a valid email';
      }
      return Object.keys(this.errors).length === 0;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  selectRole(role: string) {
    this.formData.role = role;
    const roleIcons: { [key: string]: string } = {
      'admin': 'shield',
      'worker': 'user'
    };
    this.formData.icon = roleIcons[role];
  }

submitRegistration() {
  if (!this.validateStep(this.currentStep)) return;

  this.isLoading = true;

  this.authService.register({
    email: this.formData.email,
    username: this.formData.username,
    password: this.formData.password,
    fullname: this.formData.fullName,  // ✅ This maps correctly to backend
    role: this.formData.role
  }).subscribe({
    next: (res) => {
      console.log('Register success:', res);
      this.isLoading = false;
      this.router.navigate(['/login']);
    },
    error: (err: any) => {  // ✅ Just add type annotation
      console.error(err);
      this.errors['general'] = err.error?.error || err.error?.message || 'Registration failed';
      this.isLoading = false;
    }
  });
}

  goToLogin() {
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    this.theme.toggle();
  }
}
