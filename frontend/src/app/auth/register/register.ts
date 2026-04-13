import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from "lucide-angular";
import { ThemeService } from '../../theme.service';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';
import { ToastService } from '../../shared/toast.service';

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
  imports: [FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
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
  showPassword = false;
  showConfirmPassword = false;

  constructor(private router: Router, private authService: AuthService, private toast: ToastService, public theme: ThemeService, public i18n: I18nService) {}

  get progressPercentage() {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  validateStep(step: number): boolean {
    this.errors = {};

    if (step === 1) {
      if (!this.formData.role) {
        this.errors['role'] = this.i18n.t('register.error.selectRole');
        return false;
      }
    } else if (step === 2) {
      if (!this.formData.username || this.formData.username.length < 3) {
        this.errors['username'] = this.i18n.t('register.error.usernameLength');
      } else if (!/^[a-zA-Z0-9_.\-]+$/.test(this.formData.username)) {
        this.errors['username'] = this.i18n.t('register.error.usernameChars');
      }
      if (!this.formData.password || this.formData.password.length < 8) {
        this.errors['password'] = this.i18n.t('register.error.passwordLength');
      } else {
        const pw = this.formData.password;
        if (!/[A-Z]/.test(pw)) this.errors['password'] = this.i18n.t('register.error.passwordUppercase');
        else if (!/[a-z]/.test(pw)) this.errors['password'] = this.i18n.t('register.error.passwordLowercase');
        else if (!/[0-9]/.test(pw)) this.errors['password'] = this.i18n.t('register.error.passwordDigit');
        else if (!/[^A-Za-z0-9]/.test(pw)) this.errors['password'] = this.i18n.t('register.error.passwordSpecial');
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errors['confirmPassword'] = this.i18n.t('register.error.passwordMismatch');
      }
      return Object.keys(this.errors).length === 0;
    } else if (step === 3) {
      if (!this.formData.fullName) {
        this.errors['fullName'] = this.i18n.t('register.error.fullNameRequired');
      }
      if (!this.formData.email || !this.isValidEmail(this.formData.email)) {
        this.errors['email'] = this.i18n.t('register.error.validEmail');
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
      'worker': 'hard-hat',
      'buyer': 'shopping-bag'
    };
    this.formData.icon = roleIcons[role] || 'user';
  }

  onEnterKey() {
    if (this.currentStep < this.totalSteps) {
      this.nextStep();
    } else if (this.currentStep === this.totalSteps) {
      this.submitRegistration();
    }
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
      this.isLoading = false;
      if (res.accessToken || res.access_token || res.token) {
        this.router.navigate(['/dashboard']);
        return;
      }

      this.router.navigate(['/login'], {
        state: {
          message: res.message || this.i18n.t('register.success.awaitingApproval'),
          toastType: 'info',
        },
      });
    },
    error: (err: any) => {
      this.isLoading = false;
      // Handle field-level errors from the backend (e.g., duplicate email/username)
      const field = err.error?.field;
      const message = err.error?.error || err.error?.message || this.i18n.t('register.error.failed');
      if (field === 'email' || field === 'username') {
        this.errors[field] = message;
        // Navigate back to the step where the field is displayed
        this.currentStep = field === 'username' ? 2 : 3;
      } else {
        this.toast.show(message, { type: 'error', timeout: 3500 });
      }
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

  toggleLanguage() {
    this.i18n.toggleLanguage();
  }

  getRoleLabel(role: string) {
    if (role === 'admin') return this.i18n.t('role.admin');
    if (role === 'buyer') return this.i18n.t('role.buyer');
    return this.i18n.t('role.worker');
  }
}
