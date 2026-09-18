// ============================================
// Action Bar Component — Action buttons
// ============================================

import type { ActionButton, ActionContext } from '../types';
import { store, SubscriptionScope } from '../state/app-state';
import { setEditorCode, getEditorCode } from './code-editor';
import { executeCode } from '../core/code-executor';
import { avatarManager } from '../core/avatar-manager';
import { getCurrentAspectRatio } from './avatar-panel';

export function createActionBar(
  buttons: ActionButton[],
  tabModuleId: string,
  scope?: SubscriptionScope
): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'action-bar';

  const buttonEls: { el: HTMLButtonElement | HTMLSelectElement; btn: ActionButton }[] = [];

  for (const btn of buttons) {
    if (btn.type === 'select' && btn.options) {
      const select = document.createElement('select');
      select.className = 'action-select';
      for (const opt of btn.options) {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
      }

      // Restore previously-applied aspect ratio so the select reflects
      // the actual rendering state after the drawer is re-rendered.
      // 优先读代码里容器 div 的 data-ratio（demo 横竖屏以代码为准）；
      // 否则回退到主画布比例（初始化「画幅」下拉）。
      // 锚定 div 标签：兼容历史快照里 CSS 选择器也可能含 data-ratio，避免误读。
      let currentRatio = getEditorCode(tabModuleId)
        .match(/<div id="avatar-container"[^>]*data-ratio="(\d+\/\d+)"/)?.[1] ?? null;
      if (!currentRatio) currentRatio = getCurrentAspectRatio();
      if (currentRatio && btn.options.some((o) => o.value === currentRatio)) {
        select.value = currentRatio;
      }

      select.addEventListener('change', () => {
        const ctx = createActionContext(tabModuleId);
        btn.handler(ctx, select.value);
      });

      bar.appendChild(select);
      if (btn.requiresAvatar) {
        buttonEls.push({ el: select, btn });
      }
    } else {
      const button = document.createElement('button');
      button.className = 'action-btn';
      // 主操作（执行 / 重新加载 / Demo 预览）使用 primary 配色
      if (btn.id === 'execute' || btn.id === 'reload' || btn.id === 'demo-preview') {
        button.classList.add('action-btn--primary');
      }
      // Demo 导出使用琥珀警示色，与主操作/普通操作区分
      if (btn.id === 'demo-export') {
        button.classList.add('action-btn--warning');
      }
      button.textContent = btn.label;
      button.addEventListener('click', () => {
        const ctx = createActionContext(tabModuleId);
        btn.handler(ctx);
      });
      bar.appendChild(button);
      if (btn.requiresAvatar) {
        buttonEls.push({ el: button, btn });
      }
    }
  }

  // Update disabled state based on avatar existence
  if (buttonEls.length > 0) {
    const updateDisabled = () => {
      const hasAvatar = !!avatarManager.getAvatar();
      for (const { el } of buttonEls) {
        (el as HTMLButtonElement).disabled = !hasAvatar;
        el.style.opacity = hasAvatar ? '' : '0.4';
        el.style.cursor = hasAvatar ? '' : 'not-allowed';
      }
    };
    if (scope) scope.subscribe(updateDisabled);
    else store.subscribe(updateDisabled);
    updateDisabled();
  }

  return bar;
}

function createActionContext(tabModuleId: string): ActionContext {
  return {
    setCode: (code: string) => setEditorCode(tabModuleId, code),
    getCode: () => getEditorCode(tabModuleId),
    executeCode: async () => {
      const code = getEditorCode(tabModuleId);
      await executeCode(code);
    },
    log: (...args: any[]) => store.log('log', ...args),
    avatar: avatarManager.getAvatar(),
    store,
    navigateTab: (primary, secondary) => store.navigateTab(primary, secondary),
  };
}
