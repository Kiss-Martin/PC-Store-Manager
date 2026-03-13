import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../services/api.service';
import { I18nService } from '../i18n.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './admin-audit.html',
  styleUrls: ['./admin-audit.css'],
})
export class AdminAuditComponent implements OnInit {
  logs: any[] = [];
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
    this.api.getWithCredentials<any>(`/auth/admin/audit?page=${this.page}&limit=${this.limit}`).subscribe({
      next: (res) => {
        this.logs = res.logs || [];
        this.total = res.total || 0;
        this.loading = false;
      },
      error: (err: any) => {
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
