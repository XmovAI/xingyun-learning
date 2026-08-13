// ============================================
// Drawer Component — Sub-tabs + Content Area
// ============================================

import { store } from '../state/app-state';
import type { SecondaryTab } from '../types';
import { createCodeEditor } from './code-editor';
import { createActionBar } from './action-bar';
import { createLogPanel } from './log-panel';
import { createDocsPanel } from './docs-panel';
import { createAgentConfigPanel } from './agent-config';
import { createInitConfigPanel } from './init-config';

export function createDrawer(): HTMLElement {
  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.id = 'drawer';

  drawer.innerHTML = `
    <div class="drawer-header">
      <span class="drawer-title" id="drawer-title"></span>
      <button class="drawer-close" id="drawer-close">✕</button>
    </div>
    <div class="secondary-tabs" id="secondary-tabs"></div>
    <div class="drawer-content" id="drawer-content"></div>
  `;

  // Close button
  drawer.querySelector('#drawer-close')!.addEventListener('click', () => {
    store.set({ drawerOpen: false });
  });

  // Subscribe to state changes
  store.subscribe((state) => {
    drawer.classList.toggle('drawer--open', state.drawerOpen);
  });

  return drawer;
}

export function renderDrawerContent(
  secondaryTabs: SecondaryTab[],
  activeTabId: string,
  title: string
) {
  const titleEl = document.getElementById('drawer-title');
  const tabsContainer = document.getElementById('secondary-tabs');
  const contentContainer = document.getElementById('drawer-content');

  if (!titleEl || !tabsContainer || !contentContainer) return;

  titleEl.textContent = title;

  // Render secondary tabs
  tabsContainer.innerHTML = '';
  for (const tab of secondaryTabs) {
    const btn = document.createElement('button');
    btn.className = 'secondary-tab' + (tab.id === activeTabId ? ' secondary-tab--active' : '');
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      store.set({ activeSecondaryTab: tab.id });
    });
    tabsContainer.appendChild(btn);
  }

  // Render active tab content
  const activeTab = secondaryTabs.find(t => t.id === activeTabId);
  if (!activeTab) {
    contentContainer.innerHTML = '';
    return;
  }

  contentContainer.innerHTML = '';
  const onlyModule = activeTab.modules.length === 1;
  for (const module of activeTab.modules) {
    const section = document.createElement('div');
    section.className = 'module-section';

    switch (module.type) {
      case 'docs':
        // Docs collapse by default unless it's the only module on the tab
        section.appendChild(
          createDocsPanel(module.config?.content || '', module.config?.title, {
            startCollapsed: !onlyModule,
          })
        );
        break;
      case 'code':
        section.appendChild(createCodeEditor(module.id, module.config?.defaultCode || ''));
        break;
      case 'actions':
        section.appendChild(createActionBar(module.config?.buttons || [], module.id));
        break;
      case 'log':
        section.appendChild(createLogPanel());
        break;
      case 'config':
        section.appendChild(createAgentConfigPanel());
        break;
      case 'init-config':
        section.appendChild(createInitConfigPanel());
        break;
    }

    contentContainer.appendChild(section);
  }
}
