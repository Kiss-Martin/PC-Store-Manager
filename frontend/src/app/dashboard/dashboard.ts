import { Component, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, ExportFormat } from '../auth/auth.service';
import { ThemeService } from '../theme.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { I18nService } from '../i18n.service';
import { TranslatePipe } from '../translate.pipe';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

interface Activity {
  id: number;
  description: string;
  timestamp: string;
  type: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, CommonModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  private lastStats: any = {};
  private hadLoadError = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    public theme: ThemeService,
    public i18n: I18nService,
  ) {
    effect(() => {
      this.i18n.language();
      this.stats = this.buildStats(this.lastStats);
      if (this.hadLoadError) {
        this.loadError = this.i18n.t('dashboard.error.load');
      }
    });
  }
  stats: DashboardCard[] = [];
  activities: Activity[] = [];
  isLoading = true;
  loadError = '';

  showReportModal = false;
  reportPeriod = '7days';
  reportFormat: ExportFormat = 'csv';
  isGeneratingReport = false;

  get reportPeriods() {
    return [
      { label: this.i18n.t('dashboard.period.7days'), value: '7days' },
      { label: this.i18n.t('dashboard.period.30days'), value: '30days' },
      { label: this.i18n.t('dashboard.period.90days'), value: '90days' },
    ];
  }

  ngOnInit() {
    // Load dashboard data from backend
    this.loadDashboardData();
  }

  generateReport() {
    console.log('🔵 Opening report modal...');
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  navigateToNewOrder() {
  this.router.navigate(['/orders'], {
    queryParams: { action: 'new' }
  });
}

  downloadReport() {
  this.isGeneratingReport = true;

  this.auth.generateBusinessReport(this.reportPeriod, this.reportFormat).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-report-${this.reportPeriod}-${new Date().toISOString().split('T')[0]}.${this.reportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.isGeneratingReport = false;
      this.closeReportModal();
    },
    error: (err: any) => {
      console.error('Report generation failed:', err);
      alert(this.i18n.t('dashboard.error.generateReport'));
      this.isGeneratingReport = false;
    }
  });
}

  private buildStats(stats: any) {
    return [
      {
        title: this.i18n.t('dashboard.stats.totalProducts'),
        value: stats.totalProducts ?? 0,
        icon: 'package',
        color: '#f59e0b',
      },
      {
        title: this.i18n.t('dashboard.stats.totalSales'),
        value: stats.totalSales ?? '$0',
        icon: 'badge-dollar-sign',
        color: '#10b981',
      },
      {
        title: this.i18n.t('dashboard.stats.activeOrders'),
        value: stats.activeOrders ?? 0,
        icon: 'shopping-cart',
        color: '#3b82f6',
      },
      { title: this.i18n.t('dashboard.stats.customers'), value: stats.customers ?? 0, icon: 'users', color: '#8b5cf6' },
    ];
  }

  loadDashboardData() {
    this.loadError = '';
    this.hadLoadError = false;
    this.auth.getDashboard().subscribe({
      next: (res: any) => {
        const s = res?.stats || {};
        this.lastStats = s;
        this.stats = this.buildStats(s);

        this.activities = (res?.activities || []).map((a: any) => ({
          id: a.id,
          description: a.description,
          timestamp: a.timestamp || '',
          type: a.type || 'activity',
        }));

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Dashboard API error:', err);
        this.lastStats = {};
        this.stats = this.buildStats({});
        this.activities = [];
        this.hadLoadError = true;
        this.loadError = this.i18n.t('dashboard.error.load');

        this.isLoading = false;
      },
    });
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      order: 'package',
      inventory: 'chart-column',
      review: 'star',
      payment: 'credit-card',
    };
    return icons[type] || 'activity';
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  addNewProduct() {
    this.router.navigate(['products'], { queryParams: { action: 'add' } });
  }
}
