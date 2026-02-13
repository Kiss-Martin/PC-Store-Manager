import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { OrdersComponent } from './components/orders.component/orders.component';
import { AnalyticsComponent } from './components/analytics.component/analytics.component';
import { SettingsComponent } from './components/settings.component/settings.component';
import { ProductsComponent } from './components/products.component/products.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'products',
    component: ProductsComponent
  },
  {
    path: 'orders',
    component: OrdersComponent
  },
  {
    path: 'analytics',
    component: AnalyticsComponent
  },
  {
    path: 'settings',
    component: SettingsComponent
  }
];
