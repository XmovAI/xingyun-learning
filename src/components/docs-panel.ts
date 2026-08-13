// ============================================
// Docs Panel Component — Markdown viewer + fullscreen
// ============================================

import { marked } from 'marked';
import { store } from '../state/app-state';
import { makeCollapsible } from './collapsible';
import { createFullscreenController } from './fullscreen';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

export function createDocsPanel(
  content: string,
  title?: string,
  options?: { startCollapsed?: boolean }
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'docs-panel';

  panel.innerHTML = `
    <div class="docs-panel-header">
      <span class="collapse-title">
        <span class="collapse-chevron" aria-hidden="true"></span>
        <span class="docs-panel-title">${title || '说明'}</span>
      </span>
      <span class="docs-panel-header-actions">
        <span class="docs-zoom" hidden>
          <button type="button" class="code-zoom-btn" data-zoom="out" aria-label="缩小">−</button>
          <button type="button" class="code-zoom-label" data-zoom="reset" aria-label="重置缩放">100%</button>
          <button type="button" class="code-zoom-btn" data-zoom="in" aria-label="放大">+</button>
        </span>
        <button class="docs-panel-toggle" id="docs-fullscreen" type="button">⛶ 全屏</button>
      </span>
    </div>
    <div class="docs-panel-body collapse-body"></div>
  `;

  const header = panel.querySelector('.docs-panel-header') as HTMLElement;
  const body = panel.querySelector('.docs-panel-body') as HTMLElement;
  const toggleBtn = panel.querySelector('.docs-panel-toggle') as HTMLButtonElement;
  const zoomGroup = panel.querySelector('.docs-zoom') as HTMLElement;
  const zoomLabel = panel.querySelector('.code-zoom-label') as HTMLButtonElement;

  // Render markdown
  try {
    body.innerHTML = marked.parse(content, { async: false }) as string;
  } catch {
    body.textContent = content;
  }

  // Markdown 链接统一新窗口打开
  body.querySelectorAll('a').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });

  // Copy buttons on code blocks
  addCopyButtons(body);

  // Collapsible section (accordion is fully independent of fullscreen)
  makeCollapsible({
    header,
    target: body,
    root: panel,
    startCollapsed: options?.startCollapsed ?? false,
  });

  // --- Zoom (controls visible only in fullscreen) ---
  const applyZoom = () => {
    const zoom = store.get().zoom ?? 1;
    panel.style.setProperty('--docs-zoom', String(zoom));
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  };
  const setZoom = (zoom: number) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(zoom / ZOOM_STEP) * ZOOM_STEP));
    store.set({ zoom: clamped });
    applyZoom();
  };
  zoomGroup.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
    if (!btn) return;
    const action = btn.dataset.zoom;
    const current = store.get().zoom ?? 1;
    if (action === 'in') setZoom(current + ZOOM_STEP);
    else if (action === 'out') setZoom(current - ZOOM_STEP);
    else if (action === 'reset') setZoom(1);
  });
  applyZoom();

  // Fullscreen toggle. Note: fullscreen does NOT touch the drawer accordion
  // state — the CSS rule `.docs-panel--fullscreen .collapse-body` overrides any
  // collapse, so content shows regardless, and the drawer keeps its
  // expand/collapse on exit.
  // Portal to <body>: the drawer's transform creates a containing block for
  // `position: fixed` children, which would pin the "fullscreen" panel to the
  // drawer area instead of the viewport.
  let fullscreenReturnParent: HTMLElement | null = null;

  const fullscreen = createFullscreenController({
    onEnter: () => {
      panel.classList.add('docs-panel--fullscreen');
      store.set({ docsFullscreen: true });
      toggleBtn.textContent = '✕ 退出';
      zoomGroup.hidden = false;
      fullscreenReturnParent = panel.parentElement;
      document.body.appendChild(panel);
    },
    onExit: () => {
      panel.classList.remove('docs-panel--fullscreen');
      store.set({ docsFullscreen: false });
      toggleBtn.textContent = '⛶ 全屏';
      zoomGroup.hidden = true;
      if (fullscreenReturnParent && fullscreenReturnParent.isConnected) {
        fullscreenReturnParent.appendChild(panel);
      }
    },
  });

  toggleBtn.addEventListener('click', () => fullscreen.setFullscreen(!fullscreen.isActive()));

  return panel;
}

// --- Copy button on each rendered <pre> block ---

function addCopyButtons(root: HTMLElement) {
  root.querySelectorAll('pre').forEach((pre) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.replaceWith(wrapper);
    wrapper.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', '复制代码');
    btn.textContent = '复制';
    wrapper.appendChild(btn);

    btn.addEventListener('click', async () => {
      const ok = await copyText(pre.textContent ?? '');
      btn.textContent = ok ? '已复制' : '复制失败';
      btn.classList.toggle('code-copy-btn--done', ok);
      window.setTimeout(() => {
        btn.textContent = '复制';
        btn.classList.remove('code-copy-btn--done');
      }, 1600);
    });
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
