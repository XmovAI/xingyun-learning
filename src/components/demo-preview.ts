// ============================================
// Demo Preview — 智能体Demo iframe 预览层
//
// 用 <iframe srcdoc> 把完整的独立 HTML 示例代码嵌进画布区域运行：
//  - 与教学页完全隔离（demo 内自带 SDK 加载与实例管理）
//  - 显示预览 = 清除教学 onMessage 展示并替换 srcdoc
//  - 退出预览 = 清空 srcdoc（文档卸载，demo 内 SDK 资源随之释放）
//  - 切到其他一级 Tab 时自动退出预览，画布归还教学区
// ============================================

import { store } from '../state/app-state';

/** 智能体Demo 一级 tab 的 id（与 tab-registry 保持一致） */
const DEMO_TAB_ID = 'agent-demo';

let iframeEl: HTMLIFrameElement | null = null;

export function isDemoPreviewActive(): boolean {
  return !!store.get().demoPreviewActive;
}

function ensureIframe(): HTMLIFrameElement {
  if (iframeEl && iframeEl.isConnected) return iframeEl;
  const panel = document.querySelector('.avatar-panel');
  if (!panel) throw new Error('avatar panel not found');
  iframeEl = document.createElement('iframe');
  iframeEl.className = 'demo-preview-frame';
  iframeEl.title = '智能体 Demo 预览';
  // 需要脚本 + 麦克风；sandbox 不带 allow-same-origin 会让 CDN 脚本落入 opaque origin，
  // 这里保留 allow-same-origin（srcdoc 与父页同源），并显式授权 microphone。
  iframeEl.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframeEl.setAttribute('allow', 'microphone');
  panel.appendChild(iframeEl);
  return iframeEl;
}

/** 在画布上渲染 demo；html 应为已注入凭证的完整 HTML 文档。 */
export function showDemoPreview(html: string): void {
  const el = ensureIframe();
  el.setAttribute('srcdoc', html);
  el.style.display = 'block';
  store.set({ demoPreviewActive: true });
}

/** 退出预览：清空 srcdoc 卸载 demo 文档，释放其 SDK 实例资源。 */
export function hideDemoPreview(): void {
  const wasActive = store.get().demoPreviewActive;
  if (iframeEl) {
    iframeEl.removeAttribute('srcdoc');
    iframeEl.style.display = 'none';
  }
  if (wasActive) store.set({ demoPreviewActive: false });
}

// 切到其他一级 Tab 时自动退出预览，避免 demo 与教学实例并存
store.subscribe((state) => {
  if (state.demoPreviewActive && state.activePrimaryTab !== DEMO_TAB_ID) {
    hideDemoPreview();
  }
});