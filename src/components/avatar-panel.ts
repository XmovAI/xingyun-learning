// ============================================
// Avatar Panel Component
// ============================================

import { store } from '../state/app-state';

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

function updateStatusUI(sdkConnected: boolean, sdkStatus: string) {
  const dot = document.getElementById('avatar-status-dot');
  const text = document.getElementById('avatar-status-text');
  const loading = document.getElementById('avatar-loading');
  if (!dot || !text || !loading) return;

  dot.className = 'avatar-status-dot';
  if (sdkConnected) {
    dot.classList.add('avatar-status-dot--online');
    text.textContent = '已连接';
    loading.style.display = 'none';
  } else if (sdkStatus === 'connecting') {
    dot.classList.add('avatar-status-dot--connecting');
    text.textContent = '连接中...';
    loading.style.display = 'flex';
  } else {
    text.textContent = '未连接';
    loading.style.display = 'none';
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
  `;

  // Subscribe to state changes — only update DOM when values actually change
  store.subscribe((state) => {
    if (state.sdkConnected !== lastSdkConnected || state.sdkStatus !== lastSdkStatus) {
      lastSdkConnected = state.sdkConnected;
      lastSdkStatus = state.sdkStatus;
      updateStatusUI(state.sdkConnected, state.sdkStatus);
    }
  });

  // Re-apply aspect ratio when the panel resizes
  window.addEventListener('resize', () => {
    if (currentAspectRatio) applyAvatarAspectRatio(currentAspectRatio);
  });

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
