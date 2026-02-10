import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('PC Store Manager');
  isNavOpen = false;
  showNavbar = false;

  constructor(public router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showNavbar = !event.url.includes('login') && !event.url.includes('register');
      });
  }

  toggleNav() {
    this.isNavOpen = !this.isNavOpen;
  }

  navigate(path: string) {
    this.router.navigate([path]);
    this.isNavOpen = false;
  }
}
