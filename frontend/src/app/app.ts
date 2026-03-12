import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';

import { filter } from 'rxjs/operators';
import { LucideAngularModule, Monitor } from "lucide-angular";
import { ToastComponent } from './shared/toast/toast';
import { AuthService } from './auth/auth.service';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, ToastComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('PC Store Manager');
  isNavOpen = false;
  showNavbar = false;

  constructor(public router: Router, public auth: AuthService, public theme: ThemeService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateNavbarVisibility(event.urlAfterRedirects || event.url);
      });

    this.updateNavbarVisibility(this.router.url);

    // apply admin background when appropriate
    document.body.classList.toggle('admin-bg', this.auth.isAdmin());
  }

  private updateNavbarVisibility(url: string) {
    const isAuthRoute = url.includes('/login') || url.includes('/register') || url.includes('/forgot');
    this.showNavbar = this.auth.isAuthenticated() && !isAuthRoute;

    if (!this.showNavbar) {
      this.isNavOpen = false;
    }
  }

  toggleTheme() {
    this.theme.toggle();
  }

  openProfile() {
    this.router.navigate(['profile']);
    this.isNavOpen = false;
  }

  toggleNav() {
    this.isNavOpen = !this.isNavOpen;
  }

  navigate(path: string) {
    this.router.navigate([path]);
    this.isNavOpen = false;
  }
}
