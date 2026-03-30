import { Component, OnDestroy } from '@angular/core';
import { ToastService, Toast } from '../toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.html',
  styleUrls: ['./toast.css'],
})
export class ToastComponent implements OnDestroy {
  toasts: Toast[] = [];
  private sub: any;

  constructor(private toastService: ToastService) {
    this.sub = this.toastService.toasts$.subscribe(t => this.toasts = t);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  dismiss(id: number) {
    this.toastService.hide(id);
  }
}
