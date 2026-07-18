import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isMenuOpen = signal(false);
  isScrolled = signal(false);

  isLoggedIn   = computed(() => this.authService.isLoggedIn());
  currentUser  = computed(() => this.authService.currentUser());
  displayName  = computed(() => this.authService.getDisplayName());

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 10);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  /** True when the current route is an auth page (login/register) */
  isAuthRoute(): boolean {
    const url = this.router.url;
    return url.startsWith('/login') || url.startsWith('/register');
  }
}
