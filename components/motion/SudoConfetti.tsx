'use client';

import { useEffect } from 'react';

const SECRET = 'sudo';
const SYMBOLS = ['{', '}', ';', '(', ')', '=>'];

/**
 * Easter egg: type `sudo` anywhere on the page and a burst of code symbols goes off. The
 * confetti library is only downloaded the first time it fires. Nothing happens with reduced
 * motion, and it renders nothing.
 */
export default function SudoConfetti() {
  useEffect(() => {
    let buffer = '';
    const onKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      buffer = (buffer + event.key.toLowerCase()).slice(-SECRET.length);
      if (buffer !== SECRET) return;
      buffer = '';
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const { default: confetti } = await import('canvas-confetti');
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-fill').trim();
      const shapes = SYMBOLS.map((text) => confetti.shapeFromText({ text, scalar: 2.4, color: accent }));
      const burst = (x: number, angle: number) =>
        confetti({
          shapes,
          scalar: 2.4,
          particleCount: 26,
          spread: 70,
          angle,
          startVelocity: 48,
          gravity: 0.9,
          ticks: 160,
          origin: { x, y: 0.75 },
          disableForReducedMotion: true,
        });
      burst(0.2, 60);
      burst(0.8, 120);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
