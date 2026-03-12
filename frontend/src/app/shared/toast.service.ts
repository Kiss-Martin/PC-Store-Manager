import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSub = new BehaviorSubject<Toast[]>([]);
  private idCounter = 1;

  toasts$: Observable<Toast[]> = this.toastsSub.asObservable();

  show(message: string, opts?: Partial<Toast>) {
    const id = this.idCounter++;
    const toast: Toast = {
      id,
      message,
      type: opts?.type || 'info',
      timeout: opts?.timeout ?? 4000,
    };
    const next = [...this.toastsSub.value, toast];
    this.toastsSub.next(next);

    if (toast.timeout && toast.timeout > 0) {
      setTimeout(() => this.hide(id), toast.timeout);
    }
    return id;
  }

  hide(id: number) {
    const next = this.toastsSub.value.filter((t) => t.id !== id);
    this.toastsSub.next(next);
  }

  clear() {
    this.toastsSub.next([]);
  }
}
