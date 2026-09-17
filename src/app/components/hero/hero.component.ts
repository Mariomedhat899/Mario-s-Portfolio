import { Component, effect, inject, PLATFORM_ID, signal, viewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  angle: number;
  radius: number;
  speed: number;
  orbitDir: number;
  size: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  isAccent: boolean;
  lineLen: number;
  lineAngle: number;
  lineSpeed: number;
}

interface ColorTokens {
  accent: string;
  accentGlow: string;
  line: string;
  data: string;
  muted: string;
  text: string;
}

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

  // Pre-computed values to avoid allocations in render loop
  private particles: Particle[] = [];
  private mouse = { x: -9999, y: -9999, active: false, trail: [] as Array<{x:number;y:number;life:number}> };
  private colorTokens: ColorTokens = {
    accent: '#c86b3e',
    accentGlow: 'rgba(200, 107, 62, 0.35)',
    line: '#2e261d',
    data: '#6ec4d1',
    muted: '#b8a992',
    text: '#f5efe3'
  };
  private W = 0;
  private H = 0;
  private dpr = 1;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastResizeTime = 0;
  private resizeDebounce = false;
  private gradientCache = new Map<string, CanvasGradient>();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas.set(this.canvasRef().nativeElement);
    this.initCanvas();
    this.runTerminal();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.debouncedResize.bind(this));
  }

  private initCanvas() {
    const cv = this.canvas();
    if (!cv) return;
    this.ctx = cv.getContext('2d')!;
    this.build();

    cv.parentElement?.addEventListener('mousemove', this.onMouseMove.bind(this));
    cv.parentElement?.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    window.addEventListener('resize', this.debouncedResize.bind(this), { passive: true });

    this.frame();
  }

  private debouncedResize() {
    if (this.resizeDebounce) return;
    this.resizeDebounce = true;
    requestAnimationFrame(() => {
      this.build();
      this.resizeDebounce = false;
    });
  }

  private onMouseMove(e: MouseEvent) {
    const cv = this.canvas();
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    this.mouse.x = e.clientX - r.left;
    this.mouse.y = e.clientY - r.top;
    this.mouse.active = true;
    this.mouse.trail.push({ x: this.mouse.x, y: this.mouse.y, life: 1 });
    if (this.mouse.trail.length > 10) this.mouse.trail.shift();
  }

  private onMouseLeave() {
    this.mouse.active = false;
  }

  private getTokens(): ColorTokens {
    const cs = getComputedStyle(document.documentElement);
    return {
      accent: cs.getPropertyValue('--accent').trim() || '#c86b3e',
      accentGlow: cs.getPropertyValue('--accent-glow').trim() || 'rgba(200, 107, 62, 0.35)',
      line: cs.getPropertyValue('--line').trim() || '#2e261d',
      data: cs.getPropertyValue('--data').trim() || '#6ec4d1',
      muted: cs.getPropertyValue('--muted').trim() || '#b8a992',
      text: cs.getPropertyValue('--text').trim() || '#f5efe3',
    };
  }

  private getGradient(key: string, createFn: () => CanvasGradient): CanvasGradient {
    if (!this.gradientCache.has(key)) {
      this.gradientCache.set(key, createFn());
    }
    return this.gradientCache.get(key)!;
  }

  private build() {
    const cv = this.canvas();
    const ctx = this.ctx;
    if (!cv || !ctx) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    this.W = rect.width;
    this.H = rect.height;
    cv.width = this.W * this.dpr;
    cv.height = this.H * this.dpr;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Clear gradient cache on resize
    this.gradientCache.clear();

    // Reduce particle count significantly for performance
    // Use fewer particles but make them more visually distinct
    const isMobile = this.W < 700;
    const count = isMobile ? 18 : 30;

    this.particles = [];
    const centerX = this.W / 2;
    const centerY = this.H / 2;
    const maxRadius = Math.min(this.W, this.H) * 0.4;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxRadius * 0.6 + maxRadius * 0.2; // Keep particles in a ring
      this.particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        baseX: centerX + Math.cos(angle) * radius,
        baseY: centerY + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        speed: 0.0002 + Math.random() * 0.0004, // Slower, smoother
        orbitDir: Math.random() < 0.5 ? 1 : -1,
        size: isMobile ? 1.5 : (1.2 + Math.random() * 1.8),
        alpha: 0.25 + Math.random() * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.0008 + Math.random() * 0.0015,
        isAccent: Math.random() < 0.15,
        lineLen: 15 + Math.random() * 40,
        lineAngle: Math.random() * Math.PI * 2,
        lineSpeed: 0.0003 + Math.random() * 0.001,
      });
    }

    // Update color tokens once on build
    this.colorTokens = this.getTokens();
  }

  private frame = () => {
    const ctx = this.ctx;
    const cv = this.canvas();
    if (!ctx || !cv || this.reduceMotion) return;

    ctx.clearRect(0, 0, this.W, this.H);

    // Draw mouse trail (optimized - fewer segments)
    if (this.mouse.trail.length > 1) {
      for (let i = 0; i < this.mouse.trail.length - 1; i++) {
        const p1 = this.mouse.trail[i];
        const p2 = this.mouse.trail[i + 1];
        const alpha = (p1.life * p2.life) * 0.12;
        const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, `rgba(200, 107, 62, ${alpha})`);
        grad.addColorStop(1, `rgba(110, 196, 209, ${alpha * 0.5})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 * (i / this.mouse.trail.length);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      // Update trail life
      this.mouse.trail = this.mouse.trail
        .map(p => ({ ...p, life: p.life - 0.07 }))
        .filter(p => p.life > 0);
    }

    // Skip expensive particle-to-particle connections - removed for performance
    // Instead, draw a subtle grid/field effect

    // Update and draw particles
    const centerX = this.W / 2;
    const centerY = this.H / 2;

    // Pre-calculate center glow gradient
    const centerGlow = this.getGradient('centerGlow', () => {
      const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(this.W, this.H) * 0.35);
      g.addColorStop(0, 'rgba(200, 107, 62, 0.03)');
      g.addColorStop(1, 'rgba(200, 107, 62, 0)');
      return g;
    });

    for (const p of this.particles) {
      // Orbital motion
      p.angle += p.speed * p.orbitDir;
      const targetX = centerX + Math.cos(p.angle) * p.radius;
      const targetY = centerY + Math.sin(p.angle) * p.radius;

      // Mouse influence - gentle repulsion (optimized)
      if (this.mouse.active) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dSq = dx * dx + dy * dy;
        const maxDistSq = 32400; // 180^2
        if (dSq < maxDistSq && dSq > 0) {
          const d = Math.sqrt(dSq);
          const force = (180 - d) / 180 * 0.6; // Reduced force
          p.x += (dx / d) * force;
          p.y += (dy / d) * force;
        }
      }

      // Spring back to orbit (stiffer spring for stability)
      p.x += (targetX - p.x) * 0.012;
      p.y += (targetY - p.y) * 0.012;

      // Pulse
      p.pulsePhase += p.pulseSpeed;
      const pulse = 0.75 + 0.25 * Math.sin(p.pulsePhase);
      const currentSize = p.size * pulse;
      const currentAlpha = p.alpha * pulse;

      // Rotating spoke
      p.lineAngle += p.lineSpeed;

      // Draw particle - batch by type for fewer state changes
      const isAccent = p.isAccent;
      const baseColor = isAccent ? this.colorTokens.accent : this.colorTokens.muted;

      // Outer glow (only for accent particles)
      if (isAccent) {
        const glowKey = `particleGlow_${currentSize.toFixed(1)}`;
        const glow = this.getGradient(glowKey, () => {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 5);
          g.addColorStop(0, this.colorTokens.accentGlow);
          g.addColorStop(1, 'rgba(200, 107, 62, 0)');
          return g;
        });
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = currentAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fill();

      // Rotating spoke
      ctx.globalAlpha = currentAlpha * 0.35;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 0.6;
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

    // Center glow
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(this.W, this.H) * 0.35, 0, Math.PI * 2);
    ctx.fill();

    this.animationId = requestAnimationFrame(this.frame);
  };

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