import { Component, input, output, effect, inject, PLATFORM_ID, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements AfterViewInit, OnDestroy {
  theme = input.required<'light' | 'dark'>();
  themeToggle = output<void>();

  private platformId = inject(PLATFORM_ID);
  protected uptime = signal('T+00:00:00');
  protected mobileMenuOpen = signal(false);
  protected scrollProgress = signal(0);
  private startTime = Date.now();
  private scrollHandler: (() => void) | null = null;

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

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initScrollTracking();
    }
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  private initScrollTracking() {
    const updateScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      this.scrollProgress.set(Math.max(0, Math.min(1, progress)));
    };

    // Throttle scroll handler
    let ticking = false;
    this.scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    updateScroll();
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
}
