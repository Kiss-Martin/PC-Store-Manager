import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, ExportFormat } from '../../auth/auth.service';
import { ThemeService } from '../../theme.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';
import { ToastService } from '../../shared/toast.service';
import { Order, OrderStatus, Item, Customer, User } from '../../models/api.models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ConfirmationModalComponent, TranslatePipe],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  workers: User[] = [];
  assigningOrder: string | null = null;
  filteredOrders: Order[] = [];
  isLoading = true;
  searchTerm = '';
  selectedStatus: string = 'all';
  exportFormat: ExportFormat = 'csv';
  selectedOrder: Order | null = null;
  showDetailsModal = false;

  // Status update modal
  showStatusModal = false;
  orderToUpdate: Order | null = null;
  newStatus: OrderStatus = 'pending';

  // Cancel confirmation
  showCancelConfirm = false;
  orderToCancel: Order | null = null;

  showAddOrderModal = false;
  showNewCustomerForm = false;
  isSavingOrder = false;
  isSavingCustomer = false;
  orderError = '';
  orderSuccess = '';

  // Custom dropdown states
  showStatusFilterDropdown = false;
  showOrderStatusDropdown = false;

  products: Item[] = [];
  customers: Customer[] = [];

  newOrder = {
    item_id: '',
    customer_id: '',
    quantity: 1,
    status: 'pending' as OrderStatus,
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
    public i18n: I18nService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.showStatusFilterDropdown = false;
      this.showOrderStatusDropdown = false;
    }
  }

  ngOnInit() {
    this.loadOrders();
    this.loadProducts();
    this.loadCustomers();
    if (this.auth.isAdmin()) {
      this.loadWorkers();
    }

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new' && (this.auth.isAdmin() || this.auth.isBuyer())) {
        setTimeout(() => this.openAddOrderModal(), 200);
      }
    });
  }
  loadWorkers() {
    this.auth.getWorkers().subscribe({
      next: (res) => {
        this.workers = res.users || [];
      },
      error: (err) => console.error('Failed to load workers:', err)
    });
  }

  assignOrderToWorker(orderId: string, userId: string | null) {
    this.assigningOrder = orderId;
    const assignTo = userId || null;

    this.auth.assignOrder(orderId, assignTo).subscribe({
      next: () => {
        this.assigningOrder = null;
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed to assign order:', err);
        this.toast.show(this.i18n.t('orders.error.assign'), { type: 'error' });
        this.assigningOrder = null;
      }
    });
  }

  getWorkerName(userId: string | null | undefined): string {
    if (!userId) return this.i18n.t('orders.unassigned');
    const worker = this.workers.find(w => w.id === userId);
    return worker?.username || this.i18n.t('products.na');
  }

  loadOrders() {
    this.isLoading = true;
    this.auth.getOrders().subscribe({
      next: (res) => {
        this.orders = (res.orders || []).map((o) => ({
          ...o,
          assignedTo: o.assignedTo || null,
        }));
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
      next: (res) => {
        this.products = res.items || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products:', err);
      },
    });
  }

  loadCustomers() {
    this.auth.getCustomers().subscribe({
      next: (res) => {
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
    if (this.auth.isBuyer()) {
      this.newOrder.status = 'pending';
    }
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
      status: 'pending' as OrderStatus,
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
      this.orderError = this.i18n.t('orders.error.customerNameRequired');
      return;
    }

    this.isSavingCustomer = true;
    this.orderError = '';

    this.auth.createCustomer(this.newCustomer).subscribe({
      next: (res) => {
        this.customers.push(res.customer);
        this.newOrder.customer_id = res.customer.id;
        this.showNewCustomerForm = false;
        this.isSavingCustomer = false;
        this.orderSuccess = this.i18n.t('orders.success.customerCreated');
        setTimeout(() => (this.orderSuccess = ''), 2000);
      },
      error: (err) => {
        this.isSavingCustomer = false;
        this.orderError = (err as any).error?.error || this.i18n.t('orders.error.createCustomer');
      },
    });
  }

  createOrder() {
    this.orderError = '';
    this.orderSuccess = '';

    if (!this.newOrder.item_id || !this.newOrder.customer_id || !this.newOrder.quantity) {
      this.orderError = this.i18n.t('orders.error.requiredFields');
      return;
    }

    if (this.newOrder.quantity < 1) {
      this.orderError = this.i18n.t('orders.error.quantityMinimum');
      return;
    }

    const stock = this.getProductStock(this.newOrder.item_id);

    // Only check stock for processing/completed orders (they reduce inventory)
    if ((this.newOrder.status === 'processing' || this.newOrder.status === 'completed') && this.newOrder.quantity > stock) {
      this.orderError = this.i18n.t('orders.error.onlyUnitsAvailable', { count: stock });
      return;
    }

    this.isSavingOrder = true;

    this.auth.createOrder(this.newOrder).subscribe({
      next: () => {
        this.isSavingOrder = false;
        this.orderSuccess = this.i18n.t('orders.success.recorded');
        setTimeout(() => {
          this.closeAddOrderModal();
          this.loadOrders();
        }, 1500);
      },
      error: (err) => {
        this.isSavingOrder = false;
        this.orderError = (err as any).error?.error || this.i18n.t('orders.error.createOrder');
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
        this.toast.show(this.i18n.t('orders.error.updateStatus'), { type: 'error' });
      },
    });
  }

  confirmCancelOrder(order: Order) {
    this.orderToCancel = order;
    this.showCancelConfirm = true;
  }

  confirmDeleteOrder(order: Order) {
    if (!this.auth.isAdmin()) return;
    this.orderToCancel = order;
    this.showCancelConfirm = true;
  }

  /** Buyer can cancel their own pending/processing orders */
  canBuyerCancel(order: Order): boolean {
    return this.auth.isBuyer() && (order.status === 'pending' || order.status === 'processing');
  }

  confirmBuyerCancel(order: Order) {
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
        this.toast.show(this.i18n.t('orders.error.updateStatus'), { type: 'error' });
        this.showCancelConfirm = false;
      },
    });
  }

  deleteOrder() {
    if (!this.orderToCancel || !this.auth.isAdmin()) return;

    this.auth.deleteOrder(this.orderToCancel.id).subscribe({
      next: () => {
        this.loadOrders();
        this.showCancelConfirm = false;
        this.orderToCancel = null;
      },
      error: (err) => {
        console.error('Failed to delete order:', err);
        this.showCancelConfirm = false;
        this.orderToCancel = null;
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

  getStatusDescription(status: OrderStatus): string {
    return this.i18n.t(`orders.statusDescription.${status}`);
  }

  toggleStatusFilterDropdown() {
    this.showStatusFilterDropdown = !this.showStatusFilterDropdown;
  }

  selectStatusFilter(status: string) {
    this.selectedStatus = status;
    this.showStatusFilterDropdown = false;
    this.onStatusFilterChange();
  }

  toggleOrderStatusDropdown() {
    this.showOrderStatusDropdown = !this.showOrderStatusDropdown;
  }

  selectOrderStatus(status: OrderStatus) {
    this.newOrder.status = status;
    this.showOrderStatusDropdown = false;
  }

  getStatusFilterLabel(): string {
    if (this.selectedStatus === 'all') {
      return this.i18n.t('orders.filter.all');
    }

    return this.getStatusLabel(this.selectedStatus);
  }

  getStatusLabel(status: string): string {
    return this.i18n.t(`status.${status}`);
  }

  exportOrders() {
    this.auth.exportOrders(this.selectedStatus, this.exportFormat).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${this.selectedStatus}-${new Date().toISOString().split('T')[0]}.${this.exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to export orders:', err);
        this.toast.show(this.i18n.t('orders.error.export'), { type: 'error' });
      },
    });
  }

  printCurrentView() {
    window.print();
  }

  onProductChange() {
    // Reset quantity when product changes
    const maxStock = this.getProductStock(this.newOrder.item_id);
    if (this.newOrder.quantity > maxStock) {
      this.newOrder.quantity = Math.max(1, maxStock);
    }
    this.orderError = '';
  }

  onQuantityChange() {
    const maxStock = this.getProductStock(this.newOrder.item_id);
    if (this.newOrder.quantity > maxStock) {
      this.orderError = this.i18n.t('orders.error.onlyUnitsAvailable', { count: maxStock });
    } else {
      this.orderError = '';
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString(this.i18n.locale(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  getSelectedProductPrice(): number {
    if (!this.newOrder.item_id) return 0;
    const product = this.products.find((p) => p.id === this.newOrder.item_id);
    return product?.price || 0;
  }

  calculateOrderTotal(): number {
    return this.getSelectedProductPrice() * this.newOrder.quantity;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString(this.i18n.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
