import { Component, effect, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';

import { filter } from 'rxjs/operators';
import { LucideAngularModule, Monitor } from "lucide-angular";
import { ToastComponent } from './shared/toast/toast';
import { AuthService } from './auth/auth.service';
import { ThemeService } from './theme.service';
import { I18nService } from './i18n.service';
import { TranslatePipe } from './translate.pipe';
import { SocketService } from './services/socket.service';
import { ToastService } from './shared/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, ToastComponent, TranslatePipe],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('PC Store Manager');
  isNavOpen = false;
  showNavbar = false;

  constructor(public router: Router, public auth: AuthService, public theme: ThemeService, public i18n: I18nService, private socketService: SocketService, private toast: ToastService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateNavbarVisibility(event.urlAfterRedirects || event.url);
      });

    this.updateNavbarVisibility(this.router.url);

    // apply admin background when appropriate
    document.body.classList.toggle('admin-bg', this.auth.isAdmin());

    // Connect WebSocket when authenticated and listen for task assignment notifications
    effect(() => {
      const user = this.auth.user();
      if (user?.id) {
        this.socketService.connect(user.id);
      } else {
        this.socketService.disconnect();
      }
    });

    this.socketService.orderAssigned$.subscribe((event) => {
      const productName = event.product || 'Order';
      this.toast.show(this.i18n.t('orders.assignedToYou', { product: productName }), { type: 'info', timeout: 6000 });
    });
  }

  private updateNavbarVisibility(url: string) {
    const isAuthRoute = url.includes('/login') || url.includes('/register') || url.includes('/forgot') || url.includes('/reset-password');
    this.showNavbar = this.auth.isAuthenticated() && !isAuthRoute;

    if (!this.showNavbar) {
      this.isNavOpen = false;
    }
  }

  toggleTheme() {
    this.theme.toggle();
  }

  toggleLanguage() {
    this.i18n.toggleLanguage();
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
