/**
 * Site-wide micro-interactions layer.
 *
 * Three additive, opt-out effects that give the site a physical feel
 * without leaning on template clichés (no glassmorphism, no generic
 * ripple): an ambient cursor glow, magnetic buttons, and light 3D tilt
 * on card surfaces. Everything here is inert on touch devices and under
 * prefers-reduced-motion — it only ever adds on top of a fully usable page.
 */
export function initInteractions(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const skipPointerFx = reduceMotion || isCoarsePointer;

  if (!skipPointerFx) {
    initCursorGlow();
    initMagnetic();
    initTilt();
    initSpotlight();
  }
  if (!reduceMotion) {
    initClickFlash();
  }
}

/** A soft light that trails the pointer with a light spring lag. */
function initCursorGlow(): void {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let live = false;

  window.addEventListener(
    'pointermove',
    (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!live) {
        live = true;
        glow.classList.add('is-active');
      }
    },
    { passive: true }
  );
  window.addEventListener('pointerdown', () => glow.classList.add('is-pressed'));
  window.addEventListener('pointerup', () => glow.classList.remove('is-pressed'));
  document.documentElement.addEventListener('mouseleave', () => {
    live = false;
    glow.classList.remove('is-active');
  });

  const tick = () => {
    x += (targetX - x) * 0.14;
    y += (targetY - y) * 0.14;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
}

/** Elements with .magnetic get pulled a fraction toward the cursor, then spring back. */
function initMagnetic(): void {
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
    const pull = parseFloat(el.dataset['pull'] || '0.28');

    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transition = 'transform .1s ease-out';
      el.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .55s cubic-bezier(0.16, 0.84, 0.3, 1)';
      el.style.transform = 'translate(0, 0)';
    });
  });
}

/** Elements with .tilt get a light perspective rotation that tracks the pointer. */
function initTilt(): void {
  document.querySelectorAll<HTMLElement>('.tilt').forEach((el) => {
    const max = parseFloat(el.dataset['tiltMax'] || '5');
    el.style.transformStyle = 'preserve-3d';

    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * max * 2;
      const ry = (px - 0.5) * max * 2;
      el.style.transition = 'transform .1s ease-out';
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(2px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .6s cubic-bezier(0.16, 0.84, 0.3, 1)';
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
    });
  });
}

/** Elements with .spotlight get a radial highlight that follows the cursor via CSS vars. */
function initSpotlight(): void {
  document.querySelectorAll<HTMLElement>('.spotlight').forEach((el) => {
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
      el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
    });
  });
}

/** A small square ink-flash on click — a nod to the terminal caret, not a Material ripple. */
function initClickFlash(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = (e.target as HTMLElement)?.closest?.(
      '.btn, .copy-btn, .proj-toggle, .theme-btn'
    ) as HTMLElement | null;
    if (!target) return;

    const r = target.getBoundingClientRect();
    const flash = document.createElement('span');
    flash.className = 'click-flash';
    flash.style.left = `${e.clientX - r.left}px`;
    flash.style.top = `${e.clientY - r.top}px`;
    target.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
  });
}
