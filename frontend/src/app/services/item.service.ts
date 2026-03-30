import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Item, Category, Brand } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ItemService {
  constructor(private api: ApiService) {}

  getItems(): Observable<{ items: Item[] }> {
    return this.api.get<{ items: Item[] }>('/items');
  }

  createItem(item: Partial<Item>): Observable<{ success: boolean; item: Item }> {
    const payload = { ...item } as Record<string, unknown>;
    delete payload['specifications'];
    delete payload['specs'];
    return this.api.post<{ success: boolean; item: Item }>('/items', payload);
  }

  updateItem(id: string, item: Partial<Item>): Observable<{ item: Item }> {
    const payload = { ...item } as Record<string, unknown>;
    delete payload['specifications'];
    delete payload['specs'];
    return this.api.patch<{ item: Item }>(`/items/${id}`, payload);
  }

  deleteItem(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/items/${id}`);
  }

  getCategories(): Observable<{ categories: Category[] }> {
    return this.api.get<{ categories: Category[] }>('/items/categories');
  }

  getBrands(): Observable<{ brands: Brand[] }> {
    return this.api.get<{ brands: Brand[] }>('/items/brands');
  }
}
