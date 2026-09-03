// ============================================
// Avatar Panel Component
// ============================================

import { store } from '../state/app-state';
import { replayGuide } from './guide-tour';

let lastSdkConnected = false;
let lastSdkStatus = 'offline';

// Current avatar aspect ratio (e.g. '16/9'), null = default fill
let currentAspectRatio: string | null = null;

/** Return the aspect ratio currently applied to the container, if any. */
export function getCurrentAspectRatio(): string | null {
  return currentAspectRatio;
}

/**
 * Resize #avatar-container to the given aspect ratio so the avatar
 * fills the panel as large as possible while preserving the ratio
 * (contain behavior: one dimension = 100%, the other proportional).
 */
export function applyAvatarAspectRatio(ratio: string): void {
  currentAspectRatio = ratio;
  const container = document.getElementById('avatar-container') as HTMLElement | null;
  const panel = container?.parentElement as HTMLElement | null;
  if (!container || !panel) return;

  const [rw, rh] = ratio.split('/').map(Number);
  if (!rw || !rh) return;
  const r = rw / rh;

  const pw = panel.clientWidth;
  const ph = panel.clientHeight;
  if (!pw || !ph) return;

  // Pick the larger fit that keeps the ratio inside the panel
  let w: number;
  let h: number;
  if (pw / ph > r) {
    h = ph;
    w = h * r;
  } else {
    w = pw;
    h = w / r;
  }

  container.style.width = `${Math.floor(w)}px`;
  container.style.height = `${Math.floor(h)}px`;
}

function updateStatusUI(sdkConnected: boolean, sdkStatus: string, demoPreview: boolean) {
  const dot = document.getElementById('avatar-status-dot');
  const text = document.getElementById('avatar-status-text');
  const loading = document.getElementById('avatar-loading');
  const hint = document.getElementById('avatar-connect-hint');
  if (!dot || !text || !loading) return;

  dot.className = 'avatar-status-dot';
  if (sdkConnected) {
    dot.classList.add('avatar-status-dot--online');
    text.textContent = '已连接';
    loading.style.display = 'none';
    if (hint) hint.style.display = 'none';
  } else if (sdkStatus === 'connecting') {
    dot.classList.add('avatar-status-dot--connecting');
    text.textContent = '连接中...';
    loading.style.display = 'flex';
    if (hint) hint.style.display = 'none';
  } else if (demoPreview) {
    // Demo 预览占用画布：不显示「查看引导提示」，角标提示预览态
    text.textContent = '预览中';
    loading.style.display = 'none';
    if (hint) hint.style.display = 'none';
  } else {
    text.textContent = '未连接';
    loading.style.display = 'none';
    if (hint) hint.style.display = 'flex';
  }
}

export function createAvatarPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'avatar-panel';
  panel.innerHTML = `
    <div class="avatar-container" id="avatar-container"></div>
    <div class="avatar-status" id="avatar-status">
      <span class="avatar-status-dot" id="avatar-status-dot"></span>
      <span id="avatar-status-text">未连接</span>
    </div>
    <div class="avatar-loading" id="avatar-loading" style="display: none;">
      <div class="avatar-loading-bar">
        <div class="avatar-loading-bar-fill" id="avatar-loading-fill" style="width: 0%"></div>
      </div>
      <div class="avatar-loading-text" id="avatar-loading-text">加载中...</div>
    </div>
    <div class="avatar-connect-hint" id="avatar-connect-hint">
      <button type="button" class="avatar-connect-hint-btn" id="avatar-connect-hint-btn">查看引导提示</button>
    </div>
  `;

  // Clicking the hint button re-opens the onboarding overlay
  panel.querySelector<HTMLButtonElement>('#avatar-connect-hint-btn')?.addEventListener('click', () => {
    replayGuide();
  });

  // Subscribe to state changes — only update DOM when values actually change
  let lastDemoPreview = false;
  store.subscribe((state) => {
    if (state.sdkConnected !== lastSdkConnected || state.sdkStatus !== lastSdkStatus || state.demoPreviewActive !== lastDemoPreview) {
      lastSdkConnected = state.sdkConnected;
      lastSdkStatus = state.sdkStatus;
      lastDemoPreview = state.demoPreviewActive;
      updateStatusUI(state.sdkConnected, state.sdkStatus, state.demoPreviewActive);
    }
  });

  // Re-apply aspect ratio whenever the panel resizes. A ResizeObserver covers
  // window resizes and orientation changes (a plain window-resize listener
  // misses failure modes like embedded-webview panes), and only fires on
  // actual size changes.
  const reapplyAspect = () => {
    if (currentAspectRatio) applyAvatarAspectRatio(currentAspectRatio);
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(reapplyAspect);
    ro.observe(panel);
  } else {
    window.addEventListener('resize', reapplyAspect);
  }

  // Apply default 16:9 landscape on startup (panel is laid out by the
  // time the rAF callback runs, so clientWidth/Height are valid).
  requestAnimationFrame(() => {
    if (!currentAspectRatio) {
      applyAvatarAspectRatio('16/9');
    }
  });

  return panel;
}

export function updateLoadingProgress(progress: number) {
  const fill = document.getElementById('avatar-loading-fill');
  const text = document.getElementById('avatar-loading-text');
  if (fill) fill.style.width = `${progress}%`;
  if (text) text.textContent = `加载中... ${progress}%`;
}
