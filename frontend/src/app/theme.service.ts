import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key = 'pc_theme';
  isDark = signal<boolean>(false);

  constructor() {
    const t = localStorage.getItem(this.key) || 'light';
    this.isDark.set(t === 'dark');
    this.apply();
  }

  toggle() {
    this.isDark.update(v => !v);
    localStorage.setItem(this.key, this.isDark() ? 'dark' : 'light');
    this.apply();
  }

  apply() {
    if (this.isDark()) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
