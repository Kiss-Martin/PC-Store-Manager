import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

interface Order {
  id: string;
  orderNumber: string;
  product: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  customer: string;
  date: string;
  timestamp: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ConfirmationModalComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  searchTerm = '';
  selectedStatus: string = 'all';
  selectedOrder: Order | null = null;
  showDetailsModal = false;

  // Status update modal
  showStatusModal = false;
  orderToUpdate: Order | null = null;
  newStatus: 'pending' | 'processing' | 'completed' | 'cancelled' = 'pending';

  // Cancel confirmation
  showCancelConfirm = false;
  orderToCancel: Order | null = null;

  showAddOrderModal = false;
  showNewCustomerForm = false;
  isSavingOrder = false;
  isSavingCustomer = false;
  orderError = '';
  orderSuccess = '';

  products: any[] = [];
  customers: any[] = [];

  newOrder = {
    item_id: '',
    customer_id: '',
    quantity: 1,
  };

  newCustomer = {
    name: '',
    email: '',
    phone: '',
  };

  // Stats
  stats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  };

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadProducts();
    this.loadCustomers();
  }

  loadOrders() {
    this.isLoading = true;
    this.auth.getOrders().subscribe({
      next: (res: any) => {
        this.orders = res.orders || [];
        this.filteredOrders = this.orders;
        this.calculateStats();
        this.filterOrders();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.isLoading = false;
      },
    });
  }

  loadProducts() {
    this.auth.getItems().subscribe({
      next: (res: any) => {
        this.products = res.products || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products:', err);
      },
    });
  }

  loadCustomers() {
    this.auth.getCustomers().subscribe({
      next: (res: any) => {
        this.customers = res.customers || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load customers:', err);
      },
    });
  }

  openAddOrderModal() {
    this.showAddOrderModal = true;
    this.showNewCustomerForm = false;
    this.resetOrderForm();

    this.loadProducts();
    this.loadCustomers();
  }

  closeAddOrderModal() {
    this.showAddOrderModal = false;
    this.showNewCustomerForm = false;
    this.resetOrderForm();
  }

  resetOrderForm() {
    this.newOrder = {
      item_id: '',
      customer_id: '',
      quantity: 1,
    };
    this.newCustomer = {
      name: '',
      email: '',
      phone: '',
    };
    this.orderError = '';
    this.orderSuccess = '';
  }

  toggleNewCustomerForm() {
    this.showNewCustomerForm = !this.showNewCustomerForm;
    if (this.showNewCustomerForm) {
      this.newCustomer = {
        name: '',
        email: '',
        phone: '',
      };
    }
  }

  createCustomer() {
    if (!this.newCustomer.name) {
      this.orderError = 'Customer name is required';
      return;
    }

    this.isSavingCustomer = true;
    this.orderError = '';

    this.auth.createCustomer(this.newCustomer).subscribe({
      next: (res: any) => {
        this.customers.push(res.customer);
        this.newOrder.customer_id = res.customer.id;
        this.showNewCustomerForm = false;
        this.isSavingCustomer = false;
        this.orderSuccess = 'Customer created!';
        setTimeout(() => (this.orderSuccess = ''), 2000);
      },
      error: (err: any) => {
        this.isSavingCustomer = false;
        this.orderError = err.error?.error || 'Failed to create customer';
      },
    });
  }

  createOrder() {
    this.orderError = '';
    this.orderSuccess = '';

    if (!this.newOrder.item_id || !this.newOrder.customer_id || !this.newOrder.quantity) {
      this.orderError = 'Please fill in all required fields';
      return;
    }

    if (this.newOrder.quantity < 1) {
      this.orderError = 'Quantity must be at least 1';
      return;
    }

    const stock = this.getProductStock(this.newOrder.item_id);
    if (this.newOrder.quantity > stock) {
      this.orderError = `Only ${stock} units available`;
      return;
    }

    this.isSavingOrder = true;

    this.auth.createOrder(this.newOrder).subscribe({
      next: () => {
        this.isSavingOrder = false;
        this.orderSuccess = '✅ Order recorded successfully!';
        setTimeout(() => {
          this.closeAddOrderModal();
          this.loadOrders();
        }, 1500);
      },
      error: (err: any) => {
        this.isSavingOrder = false;
        this.orderError = err.error?.error || 'Failed to create order';
      },
    });
  }

  getProductStock(productId: string): number {
    const product = this.products.find((p) => p.id === productId);
    return product?.amount || 0;
  }

  calculateStats() {
    this.stats = {
      total: this.orders.length,
      pending: this.orders.filter((o) => o.status === 'pending').length,
      processing: this.orders.filter((o) => o.status === 'processing').length,
      completed: this.orders.filter((o) => o.status === 'completed').length,
      cancelled: this.orders.filter((o) => o.status === 'cancelled').length,
      totalRevenue: this.orders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }

  filterOrders() {
    let filtered = this.orders;

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((o) => o.status === this.selectedStatus);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(term) ||
          o.product.toLowerCase().includes(term) ||
          o.customer.toLowerCase().includes(term),
      );
    }

    this.filteredOrders = filtered;
  }

  onSearchChange() {
    this.filterOrders();
  }

  onStatusFilterChange() {
    this.filterOrders();
  }

  openDetailsModal(order: Order) {
    this.selectedOrder = order;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedOrder = null;
  }

  openStatusModal(order: Order) {
    this.orderToUpdate = order;
    this.newStatus = order.status;
    this.showStatusModal = true;
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.orderToUpdate = null;
  }

  updateOrderStatus() {
    if (!this.orderToUpdate) return;

    this.auth.updateOrderStatus(this.orderToUpdate.id, this.newStatus).subscribe({
      next: () => {
        this.loadOrders();
        this.closeStatusModal();
      },
      error: (err) => {
        console.error('Failed to update order status:', err);
        alert('Failed to update order status');
      },
    });
  }

  confirmCancelOrder(order: Order) {
    this.orderToCancel = order;
    this.showCancelConfirm = true;
  }

  cancelOrder() {
    if (!this.orderToCancel) return;

    this.auth.updateOrderStatus(this.orderToCancel.id, 'cancelled').subscribe({
      next: () => {
        this.loadOrders();
        this.showCancelConfirm = false;
        this.orderToCancel = null;
      },
      error: (err) => {
        console.error('Failed to cancel order:', err);
        this.showCancelConfirm = false;
      },
    });
  }

  closeCancelConfirm() {
    this.showCancelConfirm = false;
    this.orderToCancel = null;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'status-pending',
      processing: 'status-processing',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return classes[status] || 'status-pending';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      pending: 'clock',
      processing: 'loader-circle',
      completed: 'circle-check',
      cancelled: 'ban',
    };
    return icons[status] || 'clock';
  }

  exportOrders() {
    this.auth.exportOrders(this.selectedStatus).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${this.selectedStatus}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to export orders:', err);
        alert('Export failed. Please try again.');
      },
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
