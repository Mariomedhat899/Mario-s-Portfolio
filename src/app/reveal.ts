export function initReveal(): void {
  if (typeof document === 'undefined') return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }

  // Check for scroll-driven animations support
  const supportsScrollTimeline = 'animationTimeline' in document.documentElement.style ||
    'scrollTimeline' in window;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        // If scroll-driven animations are supported, also set animation-timeline
        if (supportsScrollTimeline && !entry.target.hasAttribute('data-scroll-animated')) {
          entry.target.setAttribute('data-scroll-animated', 'true');
          // The scroll-driven animation is defined in CSS
        }
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Add scroll-driven animation support for sections
  if (supportsScrollTimeline) {
    const sections = document.querySelectorAll('section.block, header.hero');
    sections.forEach((section, index) => {
      const el = section as HTMLElement;
      el.style.animationTimeline = 'scroll()';
      // Use view-timeline for section-based animations
      const timelineName = `--section-${index}`;
      el.style.viewTimelineName = timelineName;
    });
  }
}