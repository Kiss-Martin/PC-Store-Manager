import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.css'],
})
export class ToastComponent {
  toasts$ = null as any;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  dismiss(id: number) {
    this.toastService.hide(id);
  }
}
