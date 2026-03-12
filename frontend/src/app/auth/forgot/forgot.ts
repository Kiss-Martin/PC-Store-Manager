import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forgot.html',
  styleUrls: ['./forgot.css'],
})
export class ForgotComponent {
  email = '';
  isLoading = false;
  message = '';
  sent = false;


  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  sendReset(): void {
    if (!this.email) {
      this.message = 'Please enter your email';
      return;
    }
    this.isLoading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Always show non-disclosive message
        if (res && res.sent) {
          this.sent = true;
          this.message = 'Reset link sent. Check your inbox.';
          // show toast and redirect after short delay
          try { this.toast.show('Reset link sent. Check your inbox.', { type: 'success', timeout: 3000 }); } catch (e) {}
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          // backend didn't send (either no SMTP) — still show generic message
          this.sent = false;
          this.message = 'If that email exists, a reset link has been sent.';
          this.toast.show('If that email exists, a reset link has been sent.', { type: 'info', timeout: 4000 });
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.message = err?.error?.message || 'Failed to send reset email. Please try again later.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
