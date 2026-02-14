import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css',
})
export class ConfirmationModalComponent {
  @Input() show = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmColor: 'danger' | 'primary' = 'primary';
  @Input() icon: string = 'ban';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
