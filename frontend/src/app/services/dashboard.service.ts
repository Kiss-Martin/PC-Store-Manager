import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardStats, DashboardActivity, AnalyticsSummary, TopProduct, Transaction } from '../models/api.models';

export type ExportFormat = 'csv' | 'pdf';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService) {}

  getDashboard(): Observable<{ stats: DashboardStats; activities: DashboardActivity[] }> {
    return this.api.get<{ stats: DashboardStats; activities: DashboardActivity[] }>('/dashboard');
  }

  getAnalytics(period: string = '7days'): Observable<{
    summary: AnalyticsSummary;
    revenueChart?: { labels: string[]; data: number[] };
    categoryChart?: { labels: string[]; data: number[] };
    topProducts: TopProduct[];
    recentTransactions?: Transaction[];
  }> {
    return this.api.get(`/analytics?period=${period}`);
  }

  exportAnalytics(period: string = '7days', format: ExportFormat = 'csv'): Observable<Blob> {
    return this.api.getBlob('/analytics/export', { period, format });
  }

  generateBusinessReport(period: string = '7days', format: ExportFormat = 'csv'): Observable<Blob> {
    return this.api.getBlob('/analytics/export', { period, format });
  }
}
