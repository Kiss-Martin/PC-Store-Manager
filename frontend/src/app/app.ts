import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';

import { filter } from 'rxjs/operators';
import { LucideAngularModule, Monitor } from "lucide-angular";
import { AuthService } from './auth/auth.service';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('PC Store Manager');
  isNavOpen = false;
  showNavbar = false;

  constructor(public router: Router, public auth: AuthService, public theme: ThemeService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showNavbar = !event.url.includes('login') && !event.url.includes('register');
      });

    // apply admin background when appropriate
    document.body.classList.toggle('admin-bg', this.auth.isAdmin());
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
