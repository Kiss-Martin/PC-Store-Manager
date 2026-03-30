import { Component, OnInit } from '@angular/core';
import { JsonPipe, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../services/api.service';
import { I18nService } from '../i18n.service';
import { AuditLog } from '../models/api.models';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [LucideAngularModule, TranslatePipe, JsonPipe, DatePipe],
  templateUrl: './admin-audit.html',
  styleUrls: ['./admin-audit.css'],
})
export class AdminAuditComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  error = '';
  page = 1;
  limit = 25;
  total = 0;

  constructor(private api: ApiService, public i18n: I18nService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.api.getWithCredentials<{ logs: AuditLog[]; total: number }>(`/auth/admin/audit?page=${this.page}&limit=${this.limit}`).subscribe({
      next: (res) => {
        this.logs = res.logs || [];
        this.total = res.total || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load audit logs', err);
        this.loading = false;
        this.error = err.error?.error || this.i18n.t('admin.audit.error');
      }
    });
  }

  refreshLogs(): void {
    this.error = '';
    this.loadLogs();
  }

  prev() { if (this.page>1) { this.page--; this.loadLogs(); } }
  next() { if ((this.page*this.limit) < this.total) { this.page++; this.loadLogs(); } }
}
