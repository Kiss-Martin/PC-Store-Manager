import { Component, NgModule, OnInit } from '@angular/core';

import { LucideAngularModule } from "lucide-angular";

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
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  stats: DashboardCard[] = [];
  activities: Activity[] = [];
  isLoading = true;

  ngOnInit() {
    // Load dashboard data - replace with actual API calls later
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Mock data - replace with backend API calls
    this.stats = [
      { title: 'Total Products', value: 1250, icon: 'package', color: '#f59e0b' },
      { title: 'Total Sales', value: '$45,231', icon: 'badge-dollar-sign', color: '#10b981' },
      { title: 'Active Orders', value: 127, icon: 'shopping-cart', color: '#3b82f6' },
      { title: 'Customers', value: 856, icon: 'users', color: '#8b5cf6' }
    ];

    this.activities = [
      { id: 1, description: 'New order received', timestamp: '2 hours ago', type: 'order' },
      { id: 2, description: 'Product restocked', timestamp: '5 hours ago', type: 'inventory' },
      { id: 3, description: 'Customer review posted', timestamp: '1 day ago', type: 'review' },
      { id: 4, description: 'Payment processed', timestamp: '2 days ago', type: 'payment' }
    ];

    this.isLoading = false;
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'order': 'package',
      'inventory': 'chart-column',
      'review': 'star',
      'payment': 'credit-card'
    };
    return icons[type] || 'activity';
  }
}
