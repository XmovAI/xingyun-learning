// ============================================
// Log Panel Component — Runtime log display
// ============================================

import type { AppState, LogEntry } from '../types';
import { store, SubscriptionScope } from '../state/app-state';
import { makeCollapsible } from './collapsible';
import { createFullscreenController } from './fullscreen';

/** 判定「用户贴着底部」的容差（px），用于决定新日志是否自动滚动。 */
const BOTTOM_THRESHOLD = 24;

/** 关键字匹配：不区分大小写的子串匹配日志内容，空查询显示全部 */
export function matchesQuery(entry: { args: any[] }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return entry.args.join(' ').toLowerCase().includes(q);
}

function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;
}

function createLogLine(entry: LogEntry): HTMLElement {
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
  return line;
}

export function createLogPanel(scope?: SubscriptionScope): HTMLElement {
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

  // --- 增量渲染 ---
  // 日志在高频场景下会逐条写入（如 LLM 逐字流式返回），全量重建 DOM 会退化成
  // O(n²) 并反复触发强制重排。这里只追加新增条目，并用 rAF 合并同一帧内的多次更新。
  let lastRenderedId: number | null = null;
  let lastQuery = '';
  let rafId = 0;
  let forceFull = false;

  const renderEntries = (state: AppState) => {
    const body = panel.querySelector('#log-body') as HTMLElement | null;
    const search = panel.querySelector('#log-search') as HTMLInputElement | null;
    if (!body || !search) return;
    // 读取输入框当前值，使搜索词在条目重建后依然生效
    const query = search.value;
    const entries = state.logEntries;

    // 增量起点：找不到上次渲染的锚点（清空 / 被条数上限截断）或搜索词变化时全量重建
    const anchor = lastRenderedId === null ? -1 : entries.findIndex((e) => e.id === lastRenderedId);
    const isFull = forceFull || query !== lastQuery || anchor === -1;
    forceFull = false;
    const startIndex = isFull ? 0 : anchor + 1;

    const stick = isNearBottom(body);
    const prevScrollTop = body.scrollTop;
    if (isFull) body.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < entries.length; i++) {
      if (matchesQuery(entries[i], query)) fragment.appendChild(createLogLine(entries[i]));
    }
    body.appendChild(fragment);

    lastQuery = query;
    lastRenderedId = entries.length ? entries[entries.length - 1].id : null;

    // 仅在用户本来就贴着底部时自动滚动，避免打断上翻查看旧日志
    if (stick) body.scrollTop = body.scrollHeight;
    else if (isFull) body.scrollTop = prevScrollTop;
  };

  const scheduleRender = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      renderEntries(store.get());
    });
  };

  // Re-render on every log update, and on search input
  if (scope) scope.subscribe(scheduleRender);
  else store.subscribe(scheduleRender);
  panel.querySelector('#log-search')!.addEventListener('input', () => {
    forceFull = true;
    scheduleRender();
  });

  return panel;
}
