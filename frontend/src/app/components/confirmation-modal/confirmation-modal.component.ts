import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { I18nService } from '../../i18n.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css'],
})
export class ConfirmationModalComponent {
  @Input() show = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = '';
  @Input() cancelText = '';
  @Input() confirmColor: 'danger' | 'primary' = 'primary';
  @Input() icon: string = 'ban';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private i18n: I18nService) {}

  get resolvedTitle(): string {
    return this.title || this.i18n.t('confirmation.default.title');
  }

  get resolvedMessage(): string {
    return this.message || this.i18n.t('confirmation.default.message');
  }

  get resolvedConfirmText(): string {
    return this.confirmText || this.i18n.t('confirmation.default.confirm');
  }

  get resolvedCancelText(): string {
    return this.cancelText || this.i18n.t('confirmation.default.cancel');
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
