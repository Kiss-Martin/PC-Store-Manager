import { Component, NgModule, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, ExportFormat } from '../auth/auth.service';
import { ThemeService } from '../theme.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  imports: [LucideAngularModule, FormsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private router: Router,
    private auth: AuthService,
    public theme: ThemeService
  ) {}
  stats: DashboardCard[] = [];
  activities: Activity[] = [];
  isLoading = true;
  loadError = '';

  showReportModal = false;
  reportPeriod = '7days';
  reportFormat: ExportFormat = 'csv';
  isGeneratingReport = false;

  reportPeriods = [
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 90 Days', value: '90days' },
  ];

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
      alert('Failed to generate report');
      this.isGeneratingReport = false;
    }
  });
}

  loadDashboardData() {
    this.loadError = '';
    this.auth.getDashboard().subscribe({
      next: (res: any) => {
        const s = res?.stats || {};
        this.stats = [
          {
            title: 'Total Products',
            value: s.totalProducts ?? 0,
            icon: 'package',
            color: '#f59e0b',
          },
          {
            title: 'Total Sales',
            value: s.totalSales ?? '$0',
            icon: 'badge-dollar-sign',
            color: '#10b981',
          },
          {
            title: 'Active Orders',
            value: s.activeOrders ?? 0,
            icon: 'shopping-cart',
            color: '#3b82f6',
          },
          { title: 'Customers', value: s.customers ?? 0, icon: 'users', color: '#8b5cf6' },
        ];

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
        this.stats = [
          { title: 'Total Products', value: 0, icon: 'package', color: '#f59e0b' },
          { title: 'Total Sales', value: '$0', icon: 'badge-dollar-sign', color: '#10b981' },
          { title: 'Active Orders', value: 0, icon: 'shopping-cart', color: '#3b82f6' },
          { title: 'Customers', value: 0, icon: 'users', color: '#8b5cf6' },
        ];
        this.activities = [];
        this.loadError = 'Failed to load dashboard data from the backend.';

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
