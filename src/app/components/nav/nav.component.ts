import { Component, input, output, effect, inject, PLATFORM_ID, signal, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  theme = input.required<'light' | 'dark'>();
  themeToggle = output<void>();

  private platformId = inject(PLATFORM_ID);
  protected uptime = signal('T+00:00:00');
  protected mobileMenuOpen = signal(false);
  private startTime = Date.now();

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const interval = setInterval(() => {
        const s = Math.floor((Date.now() - this.startTime) / 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        this.uptime.set(`T+${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`);
      }, 1000);
      return () => clearInterval(interval);
    });
  }

  onThemeClick() {
    this.themeToggle.emit();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 760) {
      this.mobileMenuOpen.set(false);
    }
  }
}