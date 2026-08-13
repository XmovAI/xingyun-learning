// ============================================
// Fullscreen Helper — shared Escape handling
// ============================================

type FullscreenOptions = {
  onEnter: () => void;
  onExit: () => void;
};

export type FullscreenController = {
  isActive: () => boolean;
  setFullscreen: (next: boolean) => void;
};

// A single global Escape handler serves all fullscreen panels.
// `activeExit` points at the currently-fullscreen panel's exit callback.
let activeExit: (() => void) | null = null;
let escapeInstalled = false;

function installEscapeHandler() {
  if (escapeInstalled) return;
  escapeInstalled = true;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeExit) {
      // Fullscreen owns this Escape — stop it reaching the drawer-close handler
      e.stopImmediatePropagation();
      activeExit();
    }
  });
}

/**
 * Create a fullscreen controller for one panel. Only one panel can be
 * fullscreen at a time; entering a second panel exits the first.
 */
export function createFullscreenController(opts: FullscreenOptions): FullscreenController {
  installEscapeHandler();

  let active = false;

  const enter = () => {
    if (active) return;
    // Exit whatever else is fullscreen first
    if (activeExit) activeExit();
    active = true;
    activeExit = exit;
    opts.onEnter();
  };

  const exit = () => {
    if (!active) return;
    active = false;
    if (activeExit === exit) activeExit = null;
    opts.onExit();
  };

  return {
    isActive: () => active,
    setFullscreen(next: boolean) {
      if (next) enter();
      else exit();
    },
  };
}
