import { Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-education',
  imports: [],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss'
})
export class EducationComponent {
  private platformId = inject(PLATFORM_ID);
  protected inView = signal(false);

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const card = document.getElementById('langCard');
      if (!card) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { this.inView.set(true); io.unobserve(e.target); } });
      }, { threshold: .4 });
      io.observe(card);
      return () => io.disconnect();
    });
  }
}