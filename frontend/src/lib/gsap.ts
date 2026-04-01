import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins (client-side only)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

// ─── Common Animation Presets ───────────────────────────────────────────────────

/** Fade in from bottom */
export const fadeInUp = (target: gsap.TweenTarget, delay = 0) =>
  gsap.fromTo(
    target,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.6, delay, ease: 'power3.out' }
  );

/** Staggered fade in for lists */
export const staggerFadeIn = (targets: gsap.TweenTarget, delay = 0) =>
  gsap.fromTo(
    targets,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.5, delay, stagger: 0.1, ease: 'power2.out' }
  );

/** Scale bounce in */
export const bounceIn = (target: gsap.TweenTarget, delay = 0) =>
  gsap.fromTo(
    target,
    { opacity: 0, scale: 0.5 },
    { opacity: 1, scale: 1, duration: 0.6, delay, ease: 'back.out(1.7)' }
  );

/** Flip card reveal */
export const flipReveal = (target: gsap.TweenTarget, delay = 0) =>
  gsap.fromTo(
    target,
    { rotationY: 90, opacity: 0 },
    { rotationY: 0, opacity: 1, duration: 0.5, delay, ease: 'power2.out' }
  );

/** Slide in from left */
export const slideInLeft = (target: gsap.TweenTarget, delay = 0) =>
  gsap.fromTo(
    target,
    { opacity: 0, x: -60 },
    { opacity: 1, x: 0, duration: 0.6, delay, ease: 'power3.out' }
  );

/** Slide in from right */
export const slideInRight = (target: gsap.TweenTarget, delay = 0) =>
  gsap.fromTo(
    target,
    { opacity: 0, x: 60 },
    { opacity: 1, x: 0, duration: 0.6, delay, ease: 'power3.out' }
  );

/** Dramatic result reveal — green for correct, red for wrong */
export const revealResult = (
  target: gsap.TweenTarget,
  isCorrect: boolean,
  delay = 0
) => {
  const color = isCorrect ? '#22c55e' : '#ef4444';
  return gsap
    .timeline({ delay })
    .to(target, { scale: 1.05, duration: 0.15, ease: 'power1.in' })
    .to(target, {
      scale: 1,
      backgroundColor: color,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });
};

export { gsap, ScrollTrigger };
