/**
 * The motion system for JavaScript animations. Mirrors the CSS tokens in app/globals.css.
 *
 * - UI feedback (hover, press, toggles): DURATION.fast/base/slow with EASE.
 * - Choreography (reveals, the splash, scroll moments): DURATION.reveal with EASE_REVEAL, a long
 *   expo-out tail that starts fast and settles softly, so entrances feel quick but never abrupt.
 * - Anything that follows the pointer or reorders: SPRING.
 */

export const DURATION = { fast: 0.12, base: 0.2, slow: 0.32, reveal: 0.7 } as const;

/** cubic-bezier(0.2, 0.8, 0.2, 1), the same curve as `--ease-out` */
export const EASE = [0.2, 0.8, 0.2, 1] as const;

/** cubic-bezier(0.16, 1, 0.3, 1), the same curve as `--ease-reveal` */
export const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

/** Layout animations (sliding pills, reordering rows) */
export const SPRING = { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 } as const;

/** Pointer-following effects (magnetic buttons, tilt): soft enough to feel physical */
export const SPRING_SOFT = { stiffness: 220, damping: 22, mass: 0.6 } as const;

/** Delay between items in a staggered reveal, and between words in a text reveal */
export const STAGGER = 0.06;
export const STAGGER_WORDS = 0.035;

/** Offset for anchor scrolling: the sticky navbar is 64px tall */
export const NAV_OFFSET = 64;

export const TRANSITION = {
  fast: { duration: DURATION.fast, ease: EASE },
  base: { duration: DURATION.base, ease: EASE },
  slow: { duration: DURATION.slow, ease: EASE },
  reveal: { duration: DURATION.reveal, ease: EASE_REVEAL },
} as const;

/** Desktop-only flourishes (custom cursor, tilt, magnetic, smooth wheel) need a real mouse */
export const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** Fired on window when the splash screen starts leaving (see components/splash/Splash.tsx) */
export const SPLASH_END_EVENT = 'devtype:splash-end';

/** True while the boot splash covers the page (set before first paint by the head script) */
export const isSplashActive = () =>
  typeof document !== 'undefined' && document.documentElement.hasAttribute('data-splash');
