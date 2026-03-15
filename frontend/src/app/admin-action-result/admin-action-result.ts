import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-admin-action-result',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="result-container">
      <h1 class="result-title">{{ titleKey | t }}</h1>
      <p class="result-message">{{ messageKey | t }}</p>
      <a class="result-link" [routerLink]="['/admin/pending-admins']">{{ 'adminResult.manage' | t }}</a>
    </div>
  `,
  styles: [`
    .result-container {
      max-width: 36rem;
      margin: 6rem auto;
      padding: 2rem;
      text-align: center;
    }
    .result-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 1rem;
    }
    .result-message {
      color: var(--muted);
      font-size: 1rem;
      margin-bottom: 2rem;
    }
    .result-link {
      display: inline-block;
      padding: 0.6rem 1.25rem;
      background: var(--accent, #7c3aed);
      color: #fff;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .result-link:hover { opacity: 0.85; }
  `],
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
