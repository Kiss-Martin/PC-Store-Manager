import { Component, OnInit, ViewChildren, QueryList, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme.service';

Chart.register(...registerables);

interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingProduct: string;
  lowStockItems: number;
  revenueGrowth: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  trend: string;
}

interface Transaction {
  id: string;
  product: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css',
})
export class AnalyticsComponent implements OnInit {
  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

  isLoading = true;
  selectedPeriod = '7days';

  summary: AnalyticsSummary = {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingProduct: 'N/A',
    lowStockItems: 0,
    revenueGrowth: 0,
  };

  // Revenue Chart
  revenueChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Revenue',
        data: [],
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context) => {
            const value = context.parsed?.y ?? 0;
            return `Revenue: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '$' + value,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Category Distribution Chart
  categoryChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#7c3aed', '#a855f7', '#6d28d9', '#8b5cf6', '#9333ea'],
        borderWidth: 0,
      },
    ],
  };

  categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed ?? 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  topProducts: TopProduct[] = [];
  recentTransactions: Transaction[] = [];

  revenueChartType: ChartType = 'line';
  categoryChartType: ChartType = 'doughnut';

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {
    // Watch for theme changes
    effect(() => {
      this.theme.isDark();
      setTimeout(() => {
        this.updateChartTheme();
        this.cdr.detectChanges();
      }, 0);
    });
  }

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isLoading = true;

    // ✅ Call real API endpoint
    this.auth.getAnalytics(this.selectedPeriod).subscribe({
      next: (res: any) => {
        // Summary stats
        this.summary = res.summary || {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topSellingProduct: 'N/A',
          lowStockItems: 0,
          revenueGrowth: 0,
        };

        // Revenue chart data
        if (res.revenueChart) {
          this.revenueChartData.labels = res.revenueChart.labels || [];
          this.revenueChartData.datasets[0].data = res.revenueChart.data || [];
        }

        // Category chart data
        if (res.categoryChart) {
          this.categoryChartData.labels = res.categoryChart.labels || [];
          this.categoryChartData.datasets[0].data = res.categoryChart.data || [];
        }

        // Top products
        this.topProducts = res.topProducts || [];

        // Recent transactions (admin only)
        if (this.auth.isAdmin()) {
          this.recentTransactions = res.recentTransactions || [];
        }

        this.isLoading = false;
        this.updateChartTheme();
      },
      error: (err) => {
        console.error('Failed to load analytics:', err);
        this.isLoading = false;
      },
    });
  }

  changePeriod(period: string) {
    this.selectedPeriod = period;
    this.loadAnalytics();
  }

  updateChartTheme() {
    if (!this.charts || this.charts.length === 0) return;

    const isDark = this.theme.isDark();

    // Simple: light text in dark mode, dark text in light mode
    const textColor = isDark ? '#e6eef8' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Update revenue chart
    if (this.revenueChartOptions?.scales) {
      if (this.revenueChartOptions.scales['y']) {
        this.revenueChartOptions.scales['y'].ticks = {
          color: textColor,
          callback: (value) => '$' + value,
        };
        this.revenueChartOptions.scales['y'].grid = { color: gridColor };
      }
      if (this.revenueChartOptions.scales['x']) {
        this.revenueChartOptions.scales['x'].ticks = { color: textColor };
        this.revenueChartOptions.scales['x'].grid = { display: false };
      }
    }

    // Update category chart
    if (this.categoryChartOptions?.plugins?.legend?.labels) {
      this.categoryChartOptions.plugins.legend.labels.color = textColor;
    }

    // Force update all charts
    this.charts.forEach(chartDirective => {
      if (chartDirective.chart) {
        chartDirective.chart.update('active');
      }
    });
  }

  exportReport() {
  this.auth.exportAnalytics(this.selectedPeriod).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    error: (err: any) => {
      console.error('Export failed:', err);
      alert('Failed to export data');
    }
  });
}

  getStatusClass(status: string): string {
    return status === 'completed' ? 'status-completed' : 'status-pending';
  }

  getTrendIcon(trend: string): string {
    return trend === 'up' ? 'trending-up' : 'trending-down';
  }
}
