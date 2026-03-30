import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-admin-action-result',
  standalone: true,
  imports: [RouterModule, TranslatePipe],
  template: `
    <div class="max-w-xl mx-auto mt-24 p-8 text-center">
      <h1 class="text-2xl font-bold mb-4" [style.color]="'var(--color-text)'">{{ titleKey | t }}</h1>
      <p class="text-base mb-8" [style.color]="'var(--color-muted)'">{{ messageKey | t }}</p>
      <a class="inline-block px-5 py-2.5 bg-violet-600 text-white rounded-xl no-underline font-medium transition-opacity hover:opacity-85" [routerLink]="['/admin/pending-admins']">{{ 'adminResult.manage' | t }}</a>
    </div>
  `,
  styles: [],
})
export class AdminActionResultComponent {
  titleKey = 'adminResult.title';
  messageKey = 'adminResult.unknown';

  constructor(private route: ActivatedRoute) {
    const q = this.route.snapshot.queryParamMap.get('result');
    if (q === 'approved') {
      this.titleKey = 'adminResult.approved.title';
      this.messageKey = 'adminResult.approved.message';
    } else if (q === 'rejected') {
      this.titleKey = 'adminResult.rejected.title';
      this.messageKey = 'adminResult.rejected.message';
    }
  }
}
