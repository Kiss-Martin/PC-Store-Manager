import { Component, NgModule, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../theme.service';

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
  imports: [LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
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

  ngOnInit() {
    // Load dashboard data from backend
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Fetch dashboard data from backend; fall back to mock data on error
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
        // fallback to previous mock data if backend unavailable
        this.stats = [
          { title: 'Total Products', value: 1250, icon: 'package', color: '#f59e0b' },
          { title: 'Total Sales', value: '$45,231', icon: 'badge-dollar-sign', color: '#10b981' },
          { title: 'Active Orders', value: 127, icon: 'shopping-cart', color: '#3b82f6' },
          { title: 'Customers', value: 856, icon: 'users', color: '#8b5cf6' },
        ];

        this.activities = [
          { id: 1, description: 'New order received', timestamp: '2 hours ago', type: 'order' },
          { id: 2, description: 'Product restocked', timestamp: '5 hours ago', type: 'inventory' },
          { id: 3, description: 'Customer review posted', timestamp: '1 day ago', type: 'review' },
          { id: 4, description: 'Payment processed', timestamp: '2 days ago', type: 'payment' },
        ];

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
