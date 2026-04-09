import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ItemService } from '../../services/item.service';
import { ThemeService } from '../../theme.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { I18nService } from '../../i18n.service';
import { TranslatePipe } from '../../translate.pipe';
import { ToastService } from '../../shared/toast.service';
import { Category, Brand } from '../../models/api.models';

interface Product {
  id: string;
  name: string;
  amount: number;
  price: number;
  model?: string;
  specifications?: string;
  specs?: string;
  warranty?: number;
  warranty_unit?: string;
  brand_id?: string;
  category_id?: string;
  brands?: { name: string };
  categories?: { name: string };
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ConfirmationModalComponent, TranslatePipe],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];
  isLoading = true;
  searchTerm = '';
  showAddModal = false;
  editingProduct: Product | null = null;

  // ✅ Confirmation modal state
  showDeleteConfirm = false;
  productToDelete: Product | null = null;
  private openedFromDashboard = false;

  newProduct = {
    name: '',
    model: '',
    specifications: '',
    price: 0,
    amount: 0,
    warranty: 0,
    warranty_unit: 'months',
    brand_id: '',
    category_id: '',
  };

  constructor(
    public auth: AuthService,
    private itemService: ItemService,
    public theme: ThemeService,
    public i18n: I18nService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.loadBrands();

    // Check for query params to auto-open add modal
    this.route.queryParams.subscribe((params) => {
      if (params['action'] === 'add') {
        this.openedFromDashboard = true;
        this.openAddModal();
        // Clear the query param after opening modal
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true,
        });
      }
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.itemService.getItems().subscribe({
      next: (res) => {
        this.products = (res.items || []).map((item) => ({
          ...item,
          specifications: (item as any).specifications || (item as any).specs || '',
        }));
        this.filteredProducts = this.products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      },
    });
  }

  loadCategories() {
    this.itemService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.categories || [];
      },
      error: (err) => console.error('Failed to load categories:', err),
    });
  }

  loadBrands() {
    this.itemService.getBrands().subscribe({
      next: (res) => {
        this.brands = res.brands || [];
      },
      error: (err) => console.error('Failed to load brands:', err),
    });
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.model?.toLowerCase().includes(term) ||
        p.brands?.name?.toLowerCase().includes(term) ||
        p.categories?.name?.toLowerCase().includes(term),
    );
  }

  openAddModal() {
    this.showAddModal = true;
    this.editingProduct = null;
    this.resetForm();
  }

  openEditModal(product: Product) {
    this.showAddModal = true;
    this.editingProduct = product;
    this.newProduct = {
      name: product.name,
      amount: product.amount,
      price: product.price || 0,
      model: product.model || '',
      specifications: product.specifications || product.specs || '',
      warranty: product.warranty || 0,
      warranty_unit: product.warranty_unit || 'months',
      brand_id: product.brand_id || '',
      category_id: product.category_id || '',
    };
  }

  closeModal() {
    const wasFromDashboard = this.openedFromDashboard;
    this.showAddModal = false;
    this.editingProduct = null;
    this.openedFromDashboard = false;
    this.resetForm();
    if (wasFromDashboard) {
      this.router.navigate(['/dashboard']);
    }
  }

  resetForm() {
    this.newProduct = {
      name: '',
      amount: 0,
      model: '',
      specifications: '',
      warranty: 0,
      warranty_unit: 'months',
      brand_id: '',
      category_id: '',
      price: 0,
    };
  }

  saveProduct() {
    if (!this.newProduct.name) return;

    if (this.editingProduct) {
      this.itemService.updateItem(this.editingProduct.id, this.newProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
          this.toast.show(this.i18n.t('products.updateSuccess'), { type: 'success', timeout: 3000 });
        },
        error: (err) => {
          console.error('Failed to update product:', err);
          this.toast.show(err.error?.error || this.i18n.t('products.updateError'), { type: 'error', timeout: 4000 });
        },
      });
    } else {
      this.itemService.createItem(this.newProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
          this.toast.show(this.i18n.t('products.createSuccess'), { type: 'success', timeout: 3000 });
        },
        error: (err) => {
          console.error('Failed to create product:', err);
          this.toast.show(err.error?.error || this.i18n.t('products.createError'), { type: 'error', timeout: 4000 });
        },
      });
    }
  }

  // ✅ Show confirmation modal instead of browser confirm
  confirmDelete(product: Product) {
    this.productToDelete = product;
    this.showDeleteConfirm = true;
  }

  // ✅ Handle delete confirmation
  deleteProduct() {
    if (!this.productToDelete) return;

    this.itemService.deleteItem(this.productToDelete.id).subscribe({
      next: () => {
        this.loadProducts();
        this.showDeleteConfirm = false;
        this.productToDelete = null;
        this.toast.show(this.i18n.t('products.deleteSuccess'), { type: 'success', timeout: 3000 });
      },
      error: (err) => {
        console.error('Failed to delete product:', err);
        this.toast.show(err.error?.error || this.i18n.t('products.deleteError'), { type: 'error', timeout: 4000 });
        this.showDeleteConfirm = false;
        this.productToDelete = null;
      },
    });
  }

  // ✅ Handle cancel delete
  cancelDelete() {
    this.showDeleteConfirm = false;
    this.productToDelete = null;
  }

  getBrandName(product: Product): string {
    return product.brands?.name || this.i18n.t('products.na');
  }

  getCategoryName(product: Product): string {
    return product.categories?.name || this.i18n.t('products.na');
  }

  getWarrantyDisplay(product: Product): string {
    if (!product.warranty) return this.i18n.t('products.na');
    const unit = product.warranty_unit || 'months';
    return `${product.warranty} ${this.i18n.t('products.warrantyUnit.' + unit)}`;
  }

  get warrantyUnits() {
    return [
      { value: 'days', label: this.i18n.t('products.warrantyUnit.days') },
      { value: 'weeks', label: this.i18n.t('products.warrantyUnit.weeks') },
      { value: 'months', label: this.i18n.t('products.warrantyUnit.months') },
      { value: 'years', label: this.i18n.t('products.warrantyUnit.years') },
    ];
  }
}
