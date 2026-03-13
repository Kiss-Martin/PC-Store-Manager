import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './admin-sessions.html',
  styleUrls: ['./admin-sessions.css'],
})
export class AdminSessionsComponent implements OnInit {
  sessions: any[] = [];
  loading = false;
  error = '';
  success = '';
  page = 1;
  limit = 25;
  total = 0;
  q = '';
  email = '';
  start = '';
  end = '';
  pendingAdmins: any[] = [];

  constructor(public auth: AuthService, public i18n: I18nService) {}

  ngOnInit(): void {
    if (!this.auth.isAdmin()) {
      this.error = this.i18n.t('admin.forbidden');
      return;
    }
    this.loadSessions();
    this.loadPendingAdmins();
  }

  loadSessions(): void {
    this.loading = true;
    // convert date inputs to ISO strings if provided
    const startIso = this.start ? new Date(this.start).toISOString() : '';
    const endIso = this.end ? new Date(this.end).toISOString() : '';
    this.auth.getAllSessionsPaged(this.page, this.limit, this.q, this.email, startIso, endIso).subscribe({
      next: (res) => {
        this.sessions = res.tokens || [];
        this.total = res.total || 0;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load admin sessions', err);
        this.loading = false;
        this.error = err.error?.error || this.i18n.t('admin.error.load');
      }
    });
  }

  loadPendingAdmins(): void {
    this.auth.listPendingAdmins().subscribe({
      next: (res) => {
        this.pendingAdmins = res.users || [];
      },
      error: (err: any) => {
        console.error('Failed to load pending admins', err);
        this.pendingAdmins = [];
      }
    });
  }

  approveAdmin(id: string): void {
    if (!confirm(this.i18n.t('admin.confirmApprove'))) return;
    this.auth.approveAdmin(id).subscribe({
      next: () => {
        this.pendingAdmins = this.pendingAdmins.filter((u) => u.id !== id);
        this.success = this.i18n.t('admin.success.approved');
      },
      error: (err: any) => {
        console.error('Approve admin failed', err);
        this.error = err.error?.error || this.i18n.t('admin.error.approve');
      }
    });
  }

  rejectAdmin(id: string): void {
    if (!confirm(this.i18n.t('admin.confirmReject'))) return;
    this.auth.rejectAdmin(id).subscribe({
      next: () => {
        this.pendingAdmins = this.pendingAdmins.filter((u) => u.id !== id);
        this.success = this.i18n.t('admin.success.rejected');
      },
      error: (err: any) => {
        console.error('Reject admin failed', err);
        this.error = err.error?.error || this.i18n.t('admin.error.reject');
      }
    });
  }

  revoke(id: string): void {
    if (!confirm(this.i18n.t('admin.confirmRevoke'))) return;
    this.auth.revokeSessionByAdmin(id).subscribe({
      next: () => {
        this.success = this.i18n.t('admin.success.revoked');
        this.error = '';
        this.loadSessions();
      },
      error: (err: any) => {
        console.error('Admin revoke failed', err);
        this.error = err.error?.error || this.i18n.t('admin.error.revoke');
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.error = '';
    this.success = '';
    this.loadSessions();
  }

  clearFilters(): void {
    this.q = '';
    this.email = '';
    this.start = '';
    this.end = '';
    this.page = 1;
    this.error = '';
    this.success = '';
    this.loadSessions();
  }

  refreshData(): void {
    this.error = '';
    this.success = '';
    this.loadSessions();
    this.loadPendingAdmins();
  }

  hasActiveFilters(): boolean {
    return !!(this.q || this.email || this.start || this.end);
  }

  prev() {
    if (this.page > 1) { this.page--; this.loadSessions(); }
  }

  next() {
    if ((this.page * this.limit) < this.total) { this.page++; this.loadSessions(); }
  }
}
