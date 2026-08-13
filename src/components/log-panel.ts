// ============================================
// Log Panel Component — Runtime log display
// ============================================

import type { AppState } from '../types';
import { store } from '../state/app-state';
import { makeCollapsible } from './collapsible';
import { createFullscreenController } from './fullscreen';

/** 关键字匹配：不区分大小写的子串匹配日志内容，空查询显示全部 */
export function matchesQuery(entry: { args: any[] }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return entry.args.join(' ').toLowerCase().includes(q);
}

export function createLogPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'log-panel';

  panel.innerHTML = `
    <div class="log-panel-header">
      <span class="collapse-title">
        <span class="collapse-chevron" aria-hidden="true"></span>
        <span>运行日志</span>
      </span>
      <span class="log-panel-header-actions">
        <input class="log-panel-search" id="log-search" type="search" placeholder="搜索日志..." aria-label="搜索日志" />
        <button class="log-panel-clear" id="log-clear" type="button">清空</button>
        <button class="log-panel-toggle" id="log-fullscreen" type="button">⛶ 全屏</button>
      </span>
    </div>
    <div class="log-panel-body collapse-body" id="log-body"></div>
  `;

  const header = panel.querySelector('.log-panel-header') as HTMLElement;
  const body = panel.querySelector('.log-panel-body') as HTMLElement;
  makeCollapsible({ header, target: body, root: panel, startCollapsed: false });

  // Clear button
  panel.querySelector('#log-clear')!.addEventListener('click', () => {
    store.clearLog();
  });

  // Fullscreen — portal to <body>: the drawer's transform creates a containing
  // block for `position: fixed`, which would pin the panel to the drawer area.
  let fullscreenReturnParent: HTMLElement | null = null;
  const toggleBtn = panel.querySelector('#log-fullscreen') as HTMLButtonElement;
  const fullscreen = createFullscreenController({
    onEnter: () => {
      panel.classList.add('log-panel--fullscreen');
      toggleBtn.textContent = '✕ 退出';
      fullscreenReturnParent = panel.parentElement;
      document.body.appendChild(panel);
    },
    onExit: () => {
      panel.classList.remove('log-panel--fullscreen');
      toggleBtn.textContent = '⛶ 全屏';
      if (fullscreenReturnParent && fullscreenReturnParent.isConnected) {
        fullscreenReturnParent.appendChild(panel);
      }
    },
  });
  toggleBtn.addEventListener('click', () => fullscreen.setFullscreen(!fullscreen.isActive()));

  // Render entries, applying the live search filter. Reads the input value at
  // render time so the query survives the innerHTML rebuild.
  const render = (state: AppState) => {
    const body = panel.querySelector('#log-body') as HTMLElement;
    const search = panel.querySelector('#log-search') as HTMLInputElement;
    if (!body || !search) return;
    const query = search.value;

    body.innerHTML = '';
    for (const entry of state.logEntries) {
      if (!matchesQuery(entry, query)) continue;

      const line = document.createElement('div');
      line.className = 'log-entry' + (entry.level !== 'log' ? ` log-entry--${entry.level}` : '');

      const time = document.createElement('span');
      time.className = 'log-entry-time';
      const d = new Date(entry.timestamp);
      time.textContent = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

      const content = document.createElement('span');
      content.className = 'log-entry-content';
      content.textContent = entry.args.join(' ');

      line.appendChild(time);
      line.appendChild(content);
      body.appendChild(line);
    }

    // Auto-scroll
    body.scrollTop = body.scrollHeight;
  };

  // Re-render on every log update, and on search input
  store.subscribe((state) => render(state));
  panel.querySelector('#log-search')!.addEventListener('input', () => render(store.get()));

  return panel;
}
