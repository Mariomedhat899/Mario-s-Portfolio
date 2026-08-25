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
    let particles: any[] = [];
    let time = 0;
    const mouse = { x: -9999, y: -9999, active: false, trail: [] as Array<{x:number;y:number;life:number}> };

    const getTokens = () => {
      const cs = getComputedStyle(document.documentElement);
      return {
        accent: cs.getPropertyValue('--accent').trim() || '#c86b3e',
        accentGlow: cs.getPropertyValue('--accent-glow').trim() || 'rgba(200, 107, 62, 0.35)',
        line: cs.getPropertyValue('--line').trim() || '#2e261d',
        data: cs.getPropertyValue('--data').trim() || '#6ec4d1',
        muted: cs.getPropertyValue('--muted').trim() || '#b8a992',
        text: cs.getPropertyValue('--text').trim() || '#f5efe3',
      };
    };
    let C = getTokens();

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = cv.getBoundingClientRect();
      W = rect.width; H = rect.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = [];
      const count = W < 700 ? 35 : 60;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * Math.min(W, H) * 0.45;
        particles.push({
          x: W / 2 + Math.cos(angle) * radius,
          y: H / 2 + Math.sin(angle) * radius,
          baseX: W / 2 + Math.cos(angle) * radius,
          baseY: H / 2 + Math.sin(angle) * radius,
          angle: angle,
          radius: radius,
          speed: 0.0003 + Math.random() * 0.0006,
          orbitDir: Math.random() < 0.5 ? 1 : -1,
          size: 0.8 + Math.random() * 2.2,
          alpha: 0.15 + Math.random() * 0.35,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.001 + Math.random() * 0.0025,
          hueShift: Math.random() * 0.15,
          isAccent: Math.random() < 0.12,
          lineLen: 20 + Math.random() * 60,
          lineAngle: Math.random() * Math.PI * 2,
          lineSpeed: 0.0005 + Math.random() * 0.0015,
        });
      }
    };

    cv.parentElement?.addEventListener('mousemove', (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
      mouse.trail.push({ x: mouse.x, y: mouse.y, life: 1 });
      if (mouse.trail.length > 12) mouse.trail.shift();
    });
    cv.parentElement?.addEventListener('mouseleave', () => { mouse.active = false; });

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      C = getTokens();
      time += 1;

      // Mouse trail
      if (mouse.trail.length > 1) {
        for (let i = 0; i < mouse.trail.length - 1; i++) {
          const p1 = mouse.trail[i] as {x:number;y:number;life:number};
          const p2 = mouse.trail[i + 1] as {x:number;y:number;life:number};
          const alpha = (p1.life * p2.life) * 0.15;
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, `rgba(200, 107, 62, ${alpha})`);
          grad.addColorStop(1, `rgba(110, 196, 209, ${alpha * 0.5})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5 * (i / mouse.trail.length);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        mouse.trail = mouse.trail.map(p => ({ ...p, life: (p.life ?? 1) - 0.08 })).filter(p => p.life > 0) as Array<{x:number;y:number;life:number}>;
      }

      // Draw subtle field lines connecting nearby particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);
          const maxDist = Math.min(W, H) * 0.18;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.08;
            ctx.strokeStyle = p1.isAccent || p2.isAccent
              ? `rgba(200, 107, 62, ${alpha})`
              : `rgba(184, 169, 146, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (const p of particles) {
        // Orbital motion with subtle perturbation
        p.angle += p.speed * p.orbitDir;
        const targetX = W / 2 + Math.cos(p.angle) * p.radius;
        const targetY = H / 2 + Math.sin(p.angle) * p.radius;

        // Mouse influence - gentle repulsion
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 180 && d > 0) {
            const force = (180 - d) / 180 * 0.8;
            p.x += (dx / d) * force;
            p.y += (dy / d) * force;
          }
        }

        // Spring back to orbit
        p.x += (targetX - p.x) * 0.008;
        p.y += (targetY - p.y) * 0.008;

        // Pulse
        p.pulsePhase += p.pulseSpeed;
        const pulse = 0.7 + 0.3 * Math.sin(p.pulsePhase);
        const currentSize = p.size * pulse;
        const currentAlpha = p.alpha * pulse;

        // Rotating line emanating from particle
        p.lineAngle += p.lineSpeed;

        // Draw particle
        const isAccent = p.isAccent;
        const baseColor = isAccent ? C.accent : C.muted;
        const glowColor = isAccent ? C.accentGlow : 'rgba(184, 169, 146, 0.2)';

        // Outer glow
        if (isAccent) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 6);
          g.addColorStop(0, glowColor);
          g.addColorStop(1, 'rgba(200, 107, 62, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Rotating spoke
        ctx.globalAlpha = currentAlpha * 0.4;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x + Math.cos(p.lineAngle) * p.lineLen,
          p.y + Math.sin(p.lineAngle) * p.lineLen
        );
        ctx.stroke();

        ctx.globalAlpha = 1;
      }

      // Center subtle glow
      const centerGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.35);
      centerGlow.addColorStop(0, 'rgba(200, 107, 62, 0.04)');
      centerGlow.addColorStop(1, 'rgba(200, 107, 62, 0)');
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.35, 0, Math.PI * 2);
      ctx.fill();

      this.animationId = requestAnimationFrame(frame) ?? 0;
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