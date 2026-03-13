import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { ForgotComponent } from './auth/forgot/forgot';
import { AuthGuard } from './auth/auth.guard';
import { OrdersComponent } from './components/orders.component/orders.component';
import { AnalyticsComponent } from './components/analytics.component/analytics.component';
import { ProductsComponent } from './components/products.component/products.component';
import { ProfileComponent } from './components/profile.component/profile.component';
import { AdminSessionsComponent } from './admin-sessions/admin-sessions';
import { AdminAuditComponent } from './admin-audit/admin-audit';
import { AdminGuard } from './auth/admin.guard';
import { GuestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'admin/audit',
    component: AdminAuditComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: 'admin/sessions',
    component: AdminSessionsComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'forgot',
    component: ForgotComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
];
