import { Component, effect, inject, PLATFORM_ID, signal, viewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('netCanvas');
  private canvas = signal<HTMLCanvasElement | null>(null);
  private animationId: number | null = null;
  private reduceMotion = false;

  protected termLines = signal<string[]>([]);
  private termIndex = 0;

  private readonly SCRIPT = [
    {html: '➜ ~ dotnet run --project SmartDocQna', type: true},
    {html: '<span class="t-dim">info:</span> <span class="t-info">Now listening on: http://localhost:5271</span>', delay: 420},
    {html: '<span class="t-data">[rag]</span> <span class="t-info">ingesting handbook.pdf … 42 chunks</span>', delay: 520},
    {html: '<span class="t-data">[rag]</span> <span class="t-info">embeddings ready · nomic-embed-text</span>', delay: 480},
    {html: '<span class="t-data">[rag]</span> <span class="t-info">cosine search top-k=4 … <span class="t-ok">matched</span></span>', delay: 560},
    {html: '<span class="t-ok">✔ answer grounded in 4 passages · 312ms · $0 api cost</span>', delay: 520},
    {html: '➜ ~ <span class="caret"></span>', hold: true}
  ];

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas.set(this.canvasRef().nativeElement);
    this.initCanvas();
    this.runTerminal();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  private initCanvas() {
    const cv = this.canvas();
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    let W = 0, H = 0, dpr = 1;
    let nodes: any[] = [], edges: any[] = [], packets: any[] = [];
    const mouse = { x: -9999, y: -9999, active: false };

    const getTokens = () => {
      const cs = getComputedStyle(document.documentElement);
      return {
        node: cs.getPropertyValue('--muted').trim() || '#8b95a9',
        accent: cs.getPropertyValue('--accent').trim() || '#f0a43c',
        line: cs.getPropertyValue('--line').trim() || '#232b3d',
        data: cs.getPropertyValue('--data').trim() || '#5fc4dc'
      };
    };
    let C = getTokens();

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = cv.getBoundingClientRect();
      W = rect.width; H = rect.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = W < 700 ? 16 : 26;
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 1.4 + Math.random() * 2.2,
          vx: (Math.random() - .5) * .16,
          vy: (Math.random() - .5) * .16,
          hub: Math.random() < .18
        });
      }
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < Math.min(W, H) * .34) edges.push({ a: i, b: j });
        }
      }
      packets = [];
      const nP = Math.min(edges.length, 22);
      for (let i = 0; i < nP; i++) {
        packets.push({ e: edges[Math.floor(Math.random() * edges.length)], t: Math.random(), sp: .003 + Math.random() * .007 });
      }
    };

    cv.parentElement?.addEventListener('mousemove', (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    cv.parentElement?.addEventListener('mouseleave', () => { mouse.active = false; });

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      C = getTokens();

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        if (mouse.active) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 140 && d > 0) { n.x += dx / d * (140 - d) * .012; n.y += dy / d * (140 - d) * .012; }
        }
      }

      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const alpha = Math.max(0, 1 - d / (Math.min(W, H) * .4)) * .35;
        ctx.strokeStyle = C.line;
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      ctx.globalAlpha = 1;
      for (const p of packets) {
        p.t += p.sp;
        if (p.t >= 1) { p.e = edges[Math.floor(Math.random() * edges.length)]; p.t = 0; continue; }
        const a = nodes[p.e.a], b = nodes[p.e.b];
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, C.accent); g.addColorStop(1, 'rgba(240,164,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      }

      for (const n of nodes) {
        ctx.fillStyle = n.hub ? C.accent : C.node;
        ctx.globalAlpha = n.hub ? .9 : .5;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
        if (n.hub) {
          ctx.globalAlpha = .18;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      this.animationId = requestAnimationFrame(frame);
    };

    build();
    frame();
    window.addEventListener('resize', build);
  }

  private runTerminal() {
    this.termLines.set([]);
    this.termIndex = 0;
    this.typeNext();
  }

  private typeNext() {
    if (this.termIndex >= this.SCRIPT.length) {
      setTimeout(() => this.runTerminal(), 5200);
      return;
    }
    const step = this.SCRIPT[this.termIndex++];
    const div = document.createElement('div');
    div.className = 'ln';
    div.innerHTML = step.html;
    this.termLines.update(arr => [...arr, step.html]);

    if (step.type) {
      const tmp = document.createElement('div');
      tmp.innerHTML = step.html;
      const text = tmp.textContent || '';
      let k = 0;
      const iv = setInterval(() => {
        this.termLines.update(arr => {
          const copy = [...arr];
          copy[copy.length - 1] = text.slice(0, ++k);
          return copy;
        });
        if (k >= text.length) {
          clearInterval(iv);
          this.termLines.update(arr => { const copy = [...arr]; copy[copy.length - 1] = step.html; return copy; });
          setTimeout(() => this.typeNext(), 260);
        }
      }, this.reduceMotion ? 1 : 26);
    } else {
      setTimeout(() => this.typeNext(), this.reduceMotion ? 40 : (step.delay || 350));
    }

    // cap lines
    this.termLines.update(arr => arr.slice(-9));
  }
}