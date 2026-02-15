import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

interface Product {
  id: string;
  name: string;
  amount: number;
  model?: string;
  specifications?: string;
  warranty?: string;
  brand_id?: string;
  category_id?: string;
  brands?: { name: string };
  categories?: { name: string };
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ConfirmationModalComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  searchTerm = '';
  showAddModal = false;
  editingProduct: Product | null = null;

  // ✅ Confirmation modal state
  showDeleteConfirm = false;
  productToDelete: Product | null = null;

  newProduct = {
    name: '',
    model: '',
    specifications: '',
    price: 0,
    amount: 0,
    warranty: '',
    brand_id: '',
    category_id: '',
    date_added: ''
  };

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadProducts();

    // Check for query params to auto-open add modal
    this.route.queryParams.subscribe((params) => {
      if (params['action'] === 'add') {
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
    this.auth.getItems().subscribe({
      next: (res: any) => {
        this.products = res.items || [];
        this.filteredProducts = this.products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      },
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
      model: product.model || '',
      specifications: product.specifications || '',
      warranty: product.warranty || '',
      brand_id: product.brand_id || '',
      category_id: product.category_id || '',
      price: 0,
      date_added: ''
    };
  }

  closeModal() {
    this.showAddModal = false;
    this.editingProduct = null;
    this.resetForm();
  }

  resetForm() {
    this.newProduct = {
      name: '',
      amount: 0,
      model: '',
      specifications: '',
      warranty: '',
      brand_id: '',
      category_id: '',
      price: 0,
      date_added: ''
    };
  }

  saveProduct() {
    if (!this.newProduct.name) return;

    if (this.editingProduct) {
      this.auth.updateItem(this.editingProduct.id, this.newProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => console.error('Failed to update product:', err),
      });
    } else {
      this.auth.createItem(this.newProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => console.error('Failed to create product:', err),
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

    this.auth.deleteItem(this.productToDelete.id).subscribe({
      next: () => {
        this.loadProducts();
        this.showDeleteConfirm = false;
        this.productToDelete = null;
      },
      error: (err) => {
        console.error('Failed to delete product:', err);
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
    return product.brands?.name || 'N/A';
  }

  getCategoryName(product: Product): string {
    return product.categories?.name || 'N/A';
  }
}
