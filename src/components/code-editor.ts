// ============================================
// Code Editor Component — CodeMirror 6 wrapper
// ============================================

import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { store } from '../state/app-state';
import { resolveTheme } from '../core/theme';
import { makeCollapsible } from './collapsible';
import { createFullscreenController } from './fullscreen';

const editorInstances: Map<string, EditorView> = new Map();
const editorParents: Map<string, HTMLElement> = new Map();

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

// Light CodeMirror chrome; syntax tokens come from basicSetup's default
// highlight style (light-tuned). Dark mode uses `oneDark` instead.
const lightTheme = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#1f2937' },
  '.cm-content': { caretColor: '#2563eb' },
  '.cm-gutters': { backgroundColor: '#f1f5f9', color: '#64748b', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(59, 130, 246, 0.07)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  '.cm-cursor': { borderLeftColor: '#2563eb' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(59, 130, 246, 0.2)', outline: '1px solid #3b82f6' },
}, { dark: false });

function getThemeExtension() {
  return resolveTheme(store.get().theme ?? 'system') === 'dark' ? oneDark : lightTheme;
}

function buildExtensions(tabModuleId: string) {
  return [
    basicSetup,
    javascript(),
    getThemeExtension(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const code = update.state.doc.toString();
        store.setTabState(tabModuleId, { code });
      }
    }),
  ];
}

/**
 * Re-theme every existing editor instance to match the current app theme.
 *
 * The CodeMirror core packages are intentionally NOT imported from
 * `@codemirror/state` directly — under pnpm + vite dev pre-bundling that loads
 * a second copy of the package and breaks `instanceof` checks. Instead we
 * rebuild each editor in place with the new theme extension (content is
 * preserved from the previous document).
 */
export function setEditorTheme() {
  editorInstances.forEach((view, tabModuleId) => {
    const parent = editorParents.get(tabModuleId);
    if (!parent) return;
    const doc = view.state.doc.toString();
    view.destroy();
    const next = new EditorView({
      doc,
      extensions: buildExtensions(tabModuleId),
      parent,
    });
    editorInstances.set(tabModuleId, next);
  });
}

export function createCodeEditor(tabModuleId: string, defaultCode: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'code-editor-container';

  // Restore persisted zoom (CSS var drives font-size scaling)
  container.style.setProperty('--code-zoom', String(store.get().zoom ?? 1));

  const header = document.createElement('div');
  header.className = 'code-editor-header';
  header.innerHTML = `
    <span class="collapse-title">
      <span class="collapse-chevron" aria-hidden="true"></span>
      <span>代码编辑</span>
    </span>
    <span class="code-editor-header-actions">
      <span class="code-zoom" hidden>
        <button type="button" class="code-zoom-btn" data-zoom="out" aria-label="缩小">−</button>
        <button type="button" class="code-zoom-label" data-zoom="reset" aria-label="重置缩放">100%</button>
        <button type="button" class="code-zoom-btn" data-zoom="in" aria-label="放大">+</button>
      </span>
      <button type="button" class="code-editor-toggle">⛶ 全屏</button>
    </span>
  `;

  const editorEl = document.createElement('div');
  editorEl.className = 'code-editor-body collapse-body';
  editorEl.id = `editor-${tabModuleId}`;

  container.appendChild(header);
  container.appendChild(editorEl);

  makeCollapsible({ header, target: editorEl, root: container });

  const toggleBtn = header.querySelector('.code-editor-toggle') as HTMLButtonElement;
  const zoomGroup = header.querySelector('.code-zoom') as HTMLElement;
  const zoomLabel = header.querySelector('.code-zoom-label') as HTMLButtonElement;

  // --- Zoom (controls visible only in fullscreen) ---
  const applyZoom = () => {
    const zoom = store.get().zoom ?? 1;
    container.style.setProperty('--code-zoom', String(zoom));
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

  // --- Fullscreen ---
  let fullscreenReturnParent: HTMLElement | null = null;
  const fullscreen = createFullscreenController({
    onEnter: () => {
      container.classList.add('code-editor-container--fullscreen');
      toggleBtn.textContent = '✕ 退出';
      zoomGroup.hidden = false;
      fullscreenReturnParent = container.parentElement;
      document.body.appendChild(container);
    },
    onExit: () => {
      container.classList.remove('code-editor-container--fullscreen');
      toggleBtn.textContent = '⛶ 全屏';
      zoomGroup.hidden = true;
      if (fullscreenReturnParent && fullscreenReturnParent.isConnected) {
        fullscreenReturnParent.appendChild(container);
      }
    },
  });
  toggleBtn.addEventListener('click', () => fullscreen.setFullscreen(!fullscreen.isActive()));

  // Initialize CodeMirror after DOM attachment
  requestAnimationFrame(() => {
    const state = store.getTabState(tabModuleId);
    const initialCode = state.code || defaultCode;

    const view = new EditorView({
      doc: initialCode,
      extensions: buildExtensions(tabModuleId),
      parent: editorEl,
    });

    editorInstances.set(tabModuleId, view);
    editorParents.set(tabModuleId, editorEl);
  });

  return container;
}

export function setEditorCode(tabModuleId: string, code: string) {
  const view = editorInstances.get(tabModuleId);
  if (!view) return;

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: code,
    },
  });
}

export function getEditorCode(tabModuleId: string): string {
  const view = editorInstances.get(tabModuleId);
  if (!view) return '';
  return view.state.doc.toString();
}

export function destroyEditors() {
  editorInstances.forEach(view => view.destroy());
  editorInstances.clear();
}
