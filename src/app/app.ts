import { Component, effect, inject, AfterViewInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { HeroComponent } from './components/hero/hero.component';
import { TickerComponent } from './components/ticker/ticker.component';
import { AboutComponent } from './components/about/about.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { StackComponent } from './components/stack/stack.component';
import { EducationComponent } from './components/education/education.component';
import { ContactComponent } from './components/contact/contact.component';
import { FooterComponent } from './components/footer/footer.component';
import { initReveal } from './reveal';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavComponent,
    HeroComponent,
    TickerComponent,
    AboutComponent,
    ProjectsComponent,
    StackComponent,
    EducationComponent,
    ContactComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  protected readonly theme = signal<'light' | 'dark'>('dark');

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const saved = localStorage.getItem('mm-theme');
      if (saved) {
        this.theme.set(saved as 'light' | 'dark');
        document.documentElement.setAttribute('data-theme', saved);
      }
    });
  }

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('mm-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      initReveal();
    }
  }
}