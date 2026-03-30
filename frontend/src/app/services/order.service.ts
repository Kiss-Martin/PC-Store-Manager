import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order, Customer, User } from '../models/api.models';

export type ExportFormat = 'csv' | 'pdf';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  getOrders(): Observable<{ orders: Order[] }> {
    return this.api.get<{ orders: Order[] }>('/orders');
  }

  createOrder(order: {
    item_id: string;
    customer_id?: string;
    quantity: number;
  }): Observable<{ success: boolean; order: Order }> {
    return this.api.post<{ success: boolean; order: Order }>('/orders', order);
  }

  updateOrderStatus(id: string, status: string): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>(`/orders/${id}/status`, { status });
  }

  deleteOrder(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/orders/${id}`);
  }

  assignOrder(orderId: string, userId: string | null): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>(`/orders/${orderId}/assign`, { assigned_to: userId });
  }

  exportOrders(status: string = 'all', format: ExportFormat = 'csv'): Observable<Blob> {
    return this.api.getBlob('/orders/export', { status, format });
  }

  getCustomers(): Observable<{ customers: Customer[] }> {
    return this.api.get<{ customers: Customer[] }>('/customers');
  }

  createCustomer(customer: {
    name: string;
    email?: string;
    phone?: string;
  }): Observable<{ success: boolean; customer: Customer }> {
    return this.api.post<{ success: boolean; customer: Customer }>('/customers', customer);
  }

  getWorkers(): Observable<{ users: User[] }> {
    return this.api.get<{ users: User[] }>('/users/workers');
  }
}
