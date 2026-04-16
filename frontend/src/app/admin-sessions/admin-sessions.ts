import { Component, OnInit } from '@angular/core';
import { UpperCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n.service';
import { TranslatePipe } from '../translate.pipe';
import { ConfirmationModalComponent } from '../components/confirmation-modal/confirmation-modal.component';
import { Session, PendingAdmin, PendingWorker } from '../models/api.models';

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, TranslatePipe, ConfirmationModalComponent, UpperCasePipe, DatePipe],
  templateUrl: './admin-sessions.html',
  styleUrls: ['./admin-sessions.css'],
})
export class AdminSessionsComponent implements OnInit {
  sessions: Session[] = [];
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
  pendingAdmins: PendingAdmin[] = [];
  pendingWorkers: PendingAdmin[] = [];

  // Confirmation modal state
  showConfirmModal = false;
  confirmAction: 'approve' | 'reject' | 'revoke' | 'approveWorker' | 'rejectWorker' = 'approve';
  confirmTargetId: string | null = null;
  confirmTitle = '';
  confirmMessage = '';
  confirmButtonText = '';
  confirmColor: 'danger' | 'primary' = 'primary';
  confirmIcon = 'shield';

  constructor(public auth: AuthService, public i18n: I18nService) {}

  ngOnInit(): void {
    if (!this.auth.isAdmin()) {
      this.error = this.i18n.t('admin.forbidden');
      return;
    }
    this.loadSessions();
    this.loadPendingAdmins();
    this.loadPendingWorkers();
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
        this.pendingAdmins = Array.isArray(res.users) ? res.users : [];
      },
      error: (err: any) => {
        console.error('Failed to load pending admins', err);
        this.pendingAdmins = [];
      }
    });
  }

  loadPendingWorkers(): void {
    this.auth.listPendingWorkers().subscribe({
      next: (res) => {
        this.pendingWorkers = Array.isArray(res.users) ? res.users : [];
      },
      error: (err: any) => {
        console.error('Failed to load pending workers', err);
        this.pendingWorkers = [];
      }
    });
  }

  requestApproveAdmin(id: string): void {
    this.confirmAction = 'approve';
    this.confirmTargetId = id;
    this.confirmTitle = this.i18n.t('admin.approveTitle');
    this.confirmMessage = this.i18n.t('admin.confirmApprove');
    this.confirmButtonText = this.i18n.t('admin.approve');
    this.confirmColor = 'primary';
    this.confirmIcon = 'user-check';
    this.showConfirmModal = true;
  }

  requestRejectAdmin(id: string): void {
    this.confirmAction = 'reject';
    this.confirmTargetId = id;
    this.confirmTitle = this.i18n.t('admin.rejectTitle');
    this.confirmMessage = this.i18n.t('admin.confirmReject');
    this.confirmButtonText = this.i18n.t('admin.reject');
    this.confirmColor = 'danger';
    this.confirmIcon = 'user-x';
    this.showConfirmModal = true;
  }

  requestApproveWorker(id: string): void {
    this.confirmAction = 'approveWorker';
    this.confirmTargetId = id;
    this.confirmTitle = this.i18n.t('admin.approveWorkerTitle');
    this.confirmMessage = this.i18n.t('admin.confirmApproveWorker');
    this.confirmButtonText = this.i18n.t('admin.approve');
    this.confirmColor = 'primary';
    this.confirmIcon = 'user-check';
    this.showConfirmModal = true;
  }

  requestRejectWorker(id: string): void {
    this.confirmAction = 'rejectWorker';
    this.confirmTargetId = id;
    this.confirmTitle = this.i18n.t('admin.rejectWorkerTitle');
    this.confirmMessage = this.i18n.t('admin.confirmRejectWorker');
    this.confirmButtonText = this.i18n.t('admin.reject');
    this.confirmColor = 'danger';
    this.confirmIcon = 'user-x';
    this.showConfirmModal = true;
  }

  requestRevoke(id: string): void {
    this.confirmAction = 'revoke';
    this.confirmTargetId = id;
    this.confirmTitle = this.i18n.t('admin.revokeTitle');
    this.confirmMessage = this.i18n.t('admin.confirmRevoke');
    this.confirmButtonText = this.i18n.t('admin.revoke');
    this.confirmColor = 'danger';
    this.confirmIcon = 'shield-alert';
    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.confirmTargetId = null;
  }

  executeConfirm(): void {
    if (!this.confirmTargetId) return;
    const id = this.confirmTargetId;
    this.showConfirmModal = false;
    this.confirmTargetId = null;

    switch (this.confirmAction) {
      case 'approve':
        this.doApproveAdmin(id);
        break;
      case 'reject':
        this.doRejectAdmin(id);
        break;
      case 'approveWorker':
        this.doApproveWorker(id);
        break;
      case 'rejectWorker':
        this.doRejectWorker(id);
        break;
      case 'revoke':
        this.doRevoke(id);
        break;
    }
  }

  private doApproveAdmin(id: string): void {
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

  private doRejectAdmin(id: string): void {
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

  private doApproveWorker(id: string): void {
    this.auth.approveWorker(id).subscribe({
      next: () => {
        this.pendingWorkers = this.pendingWorkers.filter((u) => u.id !== id);
        this.success = this.i18n.t('admin.success.approvedWorker');
      },
      error: (err: any) => {
        console.error('Approve worker failed', err);
        this.error = err.error?.error || this.i18n.t('admin.error.approveWorker');
      }
    });
  }

  private doRejectWorker(id: string): void {
    this.auth.rejectWorker(id).subscribe({
      next: () => {
        this.pendingWorkers = this.pendingWorkers.filter((u) => u.id !== id);
        this.success = this.i18n.t('admin.success.rejectedWorker');
      },
      error: (err: any) => {
        console.error('Reject worker failed', err);
        this.error = err.error?.error || this.i18n.t('admin.error.rejectWorker');
      }
    });
  }

  private doRevoke(id: string): void {
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
