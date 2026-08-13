// ============================================
// Main Entry Point — Bootstrap the app
// ============================================

import './styles/main.css';
import './styles/sidebar.css';
import './styles/editor.css';
import './styles/components.css';

import { store } from './state/app-state';
import { createAvatarPanel } from './components/avatar-panel';
import { createSidebar } from './components/sidebar';
import { createDrawer, renderDrawerContent } from './components/drawer';
import { applyTheme, transitionTheme, resolveTheme } from './core/theme';
import type { ThemeName } from './core/theme';
import { TAB_DEFINITIONS } from './tabs/tab-registry';

function init() {
  const app = document.getElementById('app');
  if (!app) return;

  // Create layout
  const mainArea = document.createElement('div');
  mainArea.className = 'main-area';

  // Avatar panel (fills main area)
  mainArea.appendChild(createAvatarPanel());

  // Overlay for drawer
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'overlay';
  overlay.addEventListener('click', () => {
    store.set({ drawerOpen: false });
  });
  mainArea.appendChild(overlay);

  // Drawer
  mainArea.appendChild(createDrawer());

  app.appendChild(mainArea);
  app.appendChild(createSidebar(TAB_DEFINITIONS));

  // Apply persisted theme on startup (no transition on first paint), and
  // re-apply with a circular reveal on toggle. 'system' mode resolves against
  // the OS preference and re-applies live when the OS switches.
  const initialTheme = resolveTheme(store.get().theme ?? 'system');
  applyTheme(initialTheme);
  let lastTheme: ThemeName = initialTheme;
  const applyResolved = (next: ThemeName) => {
    if (next !== lastTheme) {
      lastTheme = next;
      transitionTheme(next);
    }
  };
  store.subscribe((state) => {
    applyResolved(resolveTheme(state.theme));
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyResolved(resolveTheme(store.get().theme));
  });

  // Keyboard: Escape closes drawer (unless docs is fullscreen — docs handles its own Escape)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && store.get().drawerOpen && !store.get().docsFullscreen) {
      store.set({ drawerOpen: false });
    }
  });

  // Subscribe to state: render drawer content & overlay
  let lastPrimary = '';
  let lastSecondary = '';

  store.subscribe((state) => {
    // Overlay visibility
    const overlayEl = document.getElementById('overlay');
    if (overlayEl) {
      overlayEl.classList.toggle('overlay--visible', state.drawerOpen);
    }

    // Render drawer content when tab changes
    if (
      state.drawerOpen &&
      (state.activePrimaryTab !== lastPrimary || state.activeSecondaryTab !== lastSecondary)
    ) {
      lastPrimary = state.activePrimaryTab;
      lastSecondary = state.activeSecondaryTab;

      const primaryTab = TAB_DEFINITIONS.find(t => t.id === state.activePrimaryTab);
      if (primaryTab) {
        const secondaryId = state.activeSecondaryTab || primaryTab.secondaryTabs[0]?.id;
        renderDrawerContent(primaryTab.secondaryTabs, secondaryId, primaryTab.label);
      }
    }
  });

  // Auto-select first secondary tab when opening a primary tab
  store.subscribe((state) => {
    if (state.drawerOpen && !state.activeSecondaryTab) {
      const primaryTab = TAB_DEFINITIONS.find(t => t.id === state.activePrimaryTab);
      if (primaryTab?.secondaryTabs[0]) {
        store.set({ activeSecondaryTab: primaryTab.secondaryTabs[0].id });
      }
    }
  });
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
