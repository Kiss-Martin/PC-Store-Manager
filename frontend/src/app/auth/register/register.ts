import { Component, NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from "lucide-angular";

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
    icon: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: ''
  };

  errors: { [key: string]: string } = {};
  isLoading = false;

  constructor(private router: Router) {}

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
      'admin': 'Briefcase',
      'worker': 'user'
    };
    this.formData.icon = roleIcons[role];
  }

  submitRegistration() {
    if (this.validateStep(this.currentStep)) {
      this.isLoading = true;
      // Simulate API call
      setTimeout(() => {
        console.log('Registration data:', this.formData);
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      }, 1500);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
