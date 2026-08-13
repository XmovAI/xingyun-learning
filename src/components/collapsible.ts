// ============================================
// Collapsible Helper — Accordion behavior for module sections
// ============================================

export interface CollapsibleOptions {
  /** The header element. Must contain a `.collapse-chevron` span for the arrow. */
  header: HTMLElement;
  /** The element that gets hidden when collapsed. */
  target: HTMLElement;
  /** The element that receives the `is-collapsed` class (defaults to target). */
  root?: HTMLElement;
  startCollapsed?: boolean;
}

export interface Collapsible {
  isCollapsed: () => boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

/**
 * Wires click / keyboard toggle on a module header. Clicks on real `<button>`
 * children (e.g. fullscreen, clear) and on form controls (`<input>`, `<select>`,
 * `<textarea>`) are left untouched so inner actions keep working.
 */
export function makeCollapsible(options: CollapsibleOptions): Collapsible {
  const { header, target } = options;
  const root = options.root ?? target;

  let collapsed = options.startCollapsed ?? false;

  const apply = () => {
    root.classList.toggle('is-collapsed', collapsed);
    header.setAttribute('aria-expanded', String(!collapsed));
  };

  const expand = () => { collapsed = false; apply(); };
  const collapse = () => { collapsed = true; apply(); };
  const toggle = () => { collapsed = !collapsed; apply(); };

  // Accessibility: the header is interactive even though it contains buttons.
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.classList.add('collapse-header');

  apply();

  header.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
    toggle();
  });

  header.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  return { isCollapsed: () => collapsed, toggle, expand, collapse };
}
