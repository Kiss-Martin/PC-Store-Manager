import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-admin-action-result',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="p-6 max-w-xl mx-auto text-center">
      <h1 class="text-2xl font-bold mb-4">{{ title }}</h1>
      <p class="mb-6">{{ message }}</p>
      <a class="inline-block px-4 py-2 bg-sky-600 text-white rounded" [routerLink]="['/admin/pending-admins']">Manage pending admins</a>
    </div>
  `,
})
export class AdminActionResultComponent {
  title = 'Admin action';
  message = '';

  constructor(private route: ActivatedRoute, private router: Router) {
    const q = this.route.snapshot.queryParamMap.get('result');
    if (q === 'approved') {
      this.title = 'Admin Approved';
      this.message = 'The admin account has been approved.';
    } else if (q === 'rejected') {
      this.title = 'Admin Rejected';
      this.message = 'The admin account has been rejected and removed.';
    } else {
      this.title = 'Action Result';
      this.message = 'The action result is unknown or the token may be invalid/expired.';
    }
  }
}
