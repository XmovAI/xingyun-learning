// ============================================
// Drawer Component — Sub-tabs + Content Area
// ============================================

import { store, SubscriptionScope } from '../state/app-state';
import type { SecondaryTab } from '../types';
import { createCodeEditor } from './code-editor';
import { createActionBar } from './action-bar';
import { createLogPanel } from './log-panel';
import { createDocsPanel } from './docs-panel';
import { createInitConfigPanel } from './init-config';

// 内容区里各模块（日志面板 / 操作栏）会订阅 store；每次重建内容前统一退订，
// 否则游离的旧面板会继续在每次状态变更时执行渲染，开销随切换 Tab 次数线性放大。
let contentScope = new SubscriptionScope();

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

  // Live secondary-tab gating: connection-required tabs grey out when disconnected.
  // Separate subscription so connection changes don't re-create editors.
  store.subscribe((state) => {
    const container = document.getElementById('secondary-tabs');
    if (!container) return;
    const connected = !!state.sdkConnected;
    const buttons = container.querySelectorAll<HTMLElement>('.secondary-tab');
    buttons.forEach((btn) => {
      if (btn.dataset.requiresConnection !== '1') return;
      const disabled = !connected;
      btn.classList.toggle('secondary-tab--disabled', disabled);
      (btn as HTMLButtonElement).disabled = disabled;
    });
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

  const connected = !!store.get().sdkConnected;

  // Render secondary tabs
  tabsContainer.innerHTML = '';
  for (const tab of secondaryTabs) {
    const disabled = !!tab.requiresConnection && !connected;
    const btn = document.createElement('button');
    btn.className = 'secondary-tab'
      + (tab.id === activeTabId ? ' secondary-tab--active' : '')
      + (disabled ? ' secondary-tab--disabled' : '');
    btn.textContent = tab.label;
    btn.dataset.secondaryId = tab.id;
    btn.dataset.requiresConnection = tab.requiresConnection ? '1' : '0';
    btn.disabled = disabled;
    btn.addEventListener('click', () => {
      // Guard at click time too — connection may have changed since render
      if (tab.requiresConnection && !store.get().sdkConnected) return;
      store.set({ activeSecondaryTab: tab.id });
    });
    tabsContainer.appendChild(btn);
  }

  // Render active tab content (fall back to first available tab when the
  // requested one is gated behind a missing connection)
  const requested = secondaryTabs.find(t => t.id === activeTabId);
  let shownId = activeTabId;
  if (requested?.requiresConnection && !connected) {
    shownId = secondaryTabs.find(t => !t.requiresConnection)?.id || activeTabId;
  }
  const activeTab = secondaryTabs.find(t => t.id === shownId);
  if (!activeTab) {
    contentScope.dispose();
    contentScope = new SubscriptionScope();
    contentContainer.innerHTML = '';
    return;
  }

  contentScope.dispose();
  contentScope = new SubscriptionScope();
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
        section.appendChild(createActionBar(module.config?.buttons || [], module.id, contentScope));
        break;
      case 'log':
        section.appendChild(createLogPanel(contentScope));
        break;
      case 'init-config':
        section.appendChild(createInitConfigPanel());
        break;
    }

    contentContainer.appendChild(section);
  }
}
