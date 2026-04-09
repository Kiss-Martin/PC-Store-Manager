export interface User {
  id: string;
  email: string;
  username: string;
  fullname?: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string;
  access_token?: string;
  requiresApproval?: boolean;
  message?: string | null;
}

export interface Item {
  id: string;
  name: string;
  model?: string;
  price: number;
  amount: number;
  warranty?: number;
  warranty_unit?: string;
  category_id: string;
  brand_id: string;
  date_added?: string;
  category?: string;
  brand?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  product: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  customer: string;
  date: string;
  timestamp: string;
  assignedTo?: string | null;
}

export interface Session {
  id: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  user?: {
    email: string;
    username: string;
  };
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingProduct: string;
  lowStockItems: number;
  revenueGrowth: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  trend: string;
}

export interface Transaction {
  id: string;
  product: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

export interface DashboardStats {
  totalProducts?: number;
  totalSales?: string | number;
  activeOrders?: number;
  customers?: number;
}

export interface DashboardActivity {
  id: number;
  description: string;
  timestamp: string;
  type: string;
}

export interface AuditLog {
  id: string;
  event_type: string;
  actor_user_id?: string;
  target_user_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  actor?: { email: string; username: string };
  target?: { email: string; username: string };
}

export interface PendingAdmin {
  id: string;
  email: string;
  username: string;
  fullname?: string;
}
