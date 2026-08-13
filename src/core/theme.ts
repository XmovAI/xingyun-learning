// ============================================
// Theme Manager — apply & animate theme modes
// ============================================

import { setEditorTheme } from '../components/code-editor';
import { THEME_MODES } from '../types';
import type { ThemeMode } from '../types';

/** Resolved theme actually applied to the DOM (after 'system' is resolved). */
export type ThemeName = 'dark' | 'light';

/** Map a stored theme mode to the concrete theme to render. */
export function resolveTheme(mode: ThemeMode): ThemeName {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/** Next mode in the dark → light → system cycle. Unknown values restart at dark. */
export function cycleThemeMode(mode: ThemeMode): ThemeMode {
  const i = THEME_MODES.indexOf(mode);
  return THEME_MODES[(i + 1) % THEME_MODES.length];
}

/** Apply the theme immediately (no transition). Used on startup. */
export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  setEditorTheme();
}

/**
 * Apply the theme with a circular-reveal transition that originates from the
 * sidebar theme button.
 *
 * Preferred path: the View Transitions API snapshots the page and clips the new
 * snapshot open from the button. Where that API is unavailable (older
 * Chromium / Safari / Firefox, embedded webviews) we play the same spotlight
 * by hand instead of switching instantly: an opaque veil in the old background
 * colour is masked away by a growing circle, unveiling the new theme.
 */
export function transitionTheme(next: ThemeName): void {
  const btn = document.querySelector<HTMLElement>('.sidebar-theme');
  const rect = btn?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  // The CSS clip-path keyframes read these to grow the circle from the button.
  const root = document.documentElement;
  root.style.setProperty('--theme-reveal-x', `${x}px`);
  root.style.setProperty('--theme-reveal-y', `${y}px`);

  const update = () => applyTheme(next);

  if (typeof document.startViewTransition === 'function') {
    document.startViewTransition(update);
  } else {
    revealThemeManually(next, x, y);
  }
}

/**
 * Circular-reveal fallback for browsers without the View Transitions API.
 * Timing/curve match the CSS `theme-reveal` keyframes so both paths feel the
 * same.
 *
 * The new theme is applied immediately; an opaque veil in the OLD background
 * colour sits on top. Its mask is a radial gradient whose transparent circle
 * starts as a point at the button origin and grows to cover the viewport —
 * driving the mask radius per animation frame (rather than relying on
 * `@property` interpolation) keeps the geometry exact in every browser and
 * unveils the new theme as a spotlight expanding from the button.
 */
function revealThemeManually(next: ThemeName, x: number, y: number): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyTheme(next);
    return;
  }

  const root = document.documentElement;
  const oldBg = getComputedStyle(root).backgroundColor;

  applyTheme(next);

  const maxR = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight));
  const veil = document.createElement('div');
  const gradient = `radial-gradient(circle var(--theme-mask-r) at ${x}px ${y}px, transparent 0%, black 100%)`;
  veil.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 2147483647',
    'pointer-events: none',
    `background: ${oldBg}`,
    `-webkit-mask-image: ${gradient}`,
    `mask-image: ${gradient}`,
    '--theme-mask-r: 0px',
  ].join(';');
  document.body.appendChild(veil);

  const DURATION = 450;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3); // ≈ CSS ease-out
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    veil.style.setProperty('--theme-mask-r', `${(easeOut(t) * maxR).toFixed(2)}px`);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      veil.remove();
    }
  };
  requestAnimationFrame(step);
  window.setTimeout(() => veil.remove(), DURATION + 150); // safety net
}
