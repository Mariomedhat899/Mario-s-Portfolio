import { Component, effect, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface LogEntry {
  time: string;
  method: string;
  code: number;
  path: string;
  ms: number;
  kind: 'ok' | 'warn' | 'err';
}

@Component({
  selector: 'app-ticker',
  imports: [],
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss'
})
export class TickerComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private reduceMotion = false;
  private intervalId: any = null;
  protected logs = signal<LogEntry[]>([]);

  private readonly ROUTES: [string, string, 'ok' | 'warn' | 'err'][] = [
    ['GET', '/api/products', 'ok'],
    ['GET', '/api/categories', 'ok'],
    ['POST', '/api/auth/login', 'ok'],
    ['GET', '/api/orders?date=today', 'ok'],
    ['POST', '/api/transactions', 'ok'],
    ['GET', '/api/reports/low-stock', 'warn'],
    ['POST', '/api/ask', 'ok'],
    ['PUT', '/api/tasks/128', 'ok'],
    ['GET', '/api/payments/summary', 'ok'],
    ['POST', '/api/products/import', 'ok'],
    ['GET', '/api/health', 'ok'],
    ['DELETE', '/api/categories/9', 'err'],
    ['GET', '/api/embeddings?q=invoice', 'ok']
  ];

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!this.reduceMotion) {
        // Initial logs
        for (let i = 0; i < 4; i++) this.pushLog();
        this.intervalId = setInterval(() => this.pushLog(), 1900);
      } else {
        for (let i = 0; i < 4; i++) this.pushLog();
      }
      return () => { if (this.intervalId) clearInterval(this.intervalId); };
    });
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private pushLog() {
    const [m, path, kind] = this.ROUTES[Math.floor(Math.random() * this.ROUTES.length)];
    const code = kind === 'ok'
      ? [200, 200, 200, 201, 204][Math.floor(Math.random() * 5)]
      : kind === 'warn' ? 429 : 500;
    const ms = Math.floor(Math.random() * 334) + 6;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    this.logs.update(arr => [
      { time, method: m, code, path, ms, kind },
      ...arr.slice(0, 6)
    ]);
  }
}