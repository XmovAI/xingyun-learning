// ============================================
// Sidebar Component — Vertical Primary Tabs
// ============================================

import { store } from '../state/app-state';
import { cycleThemeMode } from '../core/theme';
import type { PrimaryTab, PrimaryTabId, ThemeMode } from '../types';

export function createSidebar(tabs: PrimaryTab[]): HTMLElement {
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';

  for (const tab of tabs) {
    if (tab.hidden) continue; // e.g. the help tab, opened from its own button

    const btn = document.createElement('button');
    btn.className = 'sidebar-tab';
    btn.textContent = tab.label;
    btn.dataset.tabId = tab.id;

    if (tab.requiresConnection) {
      btn.classList.add('sidebar-tab--disabled');
      btn.dataset.tooltip = '需先创建连接';
    }

    btn.addEventListener('click', () => {
      const state = store.get();
      if (tab.requiresConnection && !state.sdkConnected) return;

      store.navigateTab(tab.id, tab.secondaryTabs[0]?.id || '');
    });

    sidebar.appendChild(btn);
  }

  // Help button — opens the drawer with the usage guide (above the theme toggle)
  const helpBtn = document.createElement('button');
  helpBtn.className = 'sidebar-help';
  helpBtn.type = 'button';
  helpBtn.setAttribute('aria-label', '使用说明');
  helpBtn.title = '使用说明';
  helpBtn.textContent = '❓';

  helpBtn.addEventListener('click', () => {
    store.navigateTab('help', 'usage');
  });

  // Theme toggle (pinned to the bottom of the sidebar)
  const themeBtn = document.createElement('button');
  themeBtn.className = 'sidebar-theme';
  themeBtn.type = 'button';
  themeBtn.setAttribute('aria-label', '切换主题（深色 / 浅色 / 跟随系统）');

  const MODE_ICON: Record<ThemeMode, string> = {
    dark: '🌙',
    light: '☀️',
    system: '☀️/🌙',
  };
  const MODE_LABEL: Record<ThemeMode, string> = {
    dark: '深色',
    light: '浅色',
    system: '跟随系统',
  };

  const updateThemeIcon = () => {
    const mode = store.get().theme ?? 'system';
    themeBtn.textContent = MODE_ICON[mode];
    themeBtn.title = `当前：${MODE_LABEL[mode]}（点击切换）`;
    themeBtn.classList.toggle('sidebar-theme--system', mode === 'system');
  };

  themeBtn.addEventListener('click', () => {
    store.set({ theme: cycleThemeMode(store.get().theme ?? 'system') });
  });

  sidebar.appendChild(helpBtn);
  sidebar.appendChild(themeBtn);

  // Render the icon once on creation — the store subscriber below only fires
  // on state changes, so without this the icon is blank until first toggle.
  updateThemeIcon();

  // Subscribe to state changes
  store.subscribe((state) => {
    const buttons = sidebar.querySelectorAll('.sidebar-tab') as NodeListOf<HTMLElement>;
    buttons.forEach((btn) => {
      const tabId = btn.dataset.tabId as PrimaryTabId;
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return;

      // Update active state
      btn.classList.toggle('sidebar-tab--active', state.activePrimaryTab === tabId && state.drawerOpen);

      // Update disabled state for connection-required tabs
      if (tab.requiresConnection) {
        const disabled = !state.sdkConnected;
        btn.classList.toggle('sidebar-tab--disabled', disabled);
      }
    });

    // Update help button active state
    helpBtn.classList.toggle('sidebar-help--active', state.activePrimaryTab === 'help' && state.drawerOpen);

    updateThemeIcon();
  });

  return sidebar;
}
