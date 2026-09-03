// ============================================
// Code Executor — Closure-based sandboxed execution
// ============================================

import { store } from '../state/app-state';
import { avatarManager } from './avatar-manager';
import { updateLoadingProgress } from '../components/avatar-panel';

/**
 * Execute code in a closure-based sandbox.
 *
 * Each execution runs in its own async IIFE, so `const` declarations
 * don't conflict across re-executions.
 *
 * When `new XingyunAvatarAgent(...)` is detected in the code, the resulting
 * instance is automatically registered with avatarManager, and its connection
 * state is synced to the store via two channels:
 *   - inherited top-level `onStatusChange`（数字枚举: 0 在线 / 1 离线 ...）
 *   - E2E `agentCallbacks.onAgentStateChange`（字符串状态，以 running 为可用态）
 *
 * Injected: avatar (current instance), log(), wait()
 */
export async function executeCode(code: string): Promise<void> {
  // 执行时注入已保存的凭证：把代码里的 {{placeholder}} 替换为真实配置，
  // 未配置的键保留占位符，由模板守卫检测并给出友好提示。
  code = store.injectPlaceholders(code);

  const avatar = avatarManager.getAvatar();

  const log = (...args: any[]) => {
    const formatted = args.map(a => {
      if (typeof a === 'object') {
        try { return JSON.stringify(a, null, 2); }
        catch { return String(a); }
      }
      return String(a);
    }).join(' ');
    store.log('log', formatted);
  };

  const wait = (seconds: number) =>
    new Promise<void>(resolve => setTimeout(resolve, seconds * 1000));

  const syncConnected = (connected: boolean, status?: string) => {
    if (connected) {
      avatarManager.setConnected(true);
      store.set({ sdkConnected: true, sdkStatus: status || 'online' });
    } else {
      avatarManager.setConnected(false);
      store.set({ sdkConnected: false, sdkStatus: 'offline' });
    }
  };

  // Intercept `new XingyunAvatarAgent(...)`:
  // 1. Register instance with avatarManager
  // 2. Wrap onStatusChange + agentCallbacks.onAgentStateChange to sync connection state
  const AgentCtor = (window as any).XingyunAvatarAgent;

  if (AgentCtor) {
    (window as any).XingyunAvatarAgent = function(options: any) {
      // Wrap inherited numeric status callback
      const userStatus = options?.onStatusChange;
      options = { ...options };
      options.onStatusChange = (status: any) => {
        // SDK status: 0 = online, 1 = offline, 4 = close, 5 = visible, 6 = invisible
        if (status === 0 || status === 'online' || status === 'visible') {
          syncConnected(true);
        } else if (status === 1 || status === 'offline' || status === 'close') {
          syncConnected(false);
        }
        if (typeof userStatus === 'function') userStatus(status);
      };

      // Wrap E2E agent state callback（字符串状态）
      const callbacks = { ...(options?.agentCallbacks || {}) };
      const userAgentState = callbacks.onAgentStateChange;
      callbacks.onAgentStateChange = (state: string) => {
        // AgentState: idle | initializing | ready | running | reconnecting | stopped | destroyed | failed
        if (state === 'running') {
          syncConnected(true);
        } else if (state === 'initializing' || state === 'reconnecting') {
          store.set({ sdkConnected: false, sdkStatus: 'connecting' });
        } else if (state === 'stopped' || state === 'destroyed' || state === 'failed') {
          syncConnected(false);
        }
        if (typeof userAgentState === 'function') userAgentState(state);
      };
      options.agentCallbacks = callbacks;

      const instance = new AgentCtor(options);
      avatarManager.setAvatar(instance);

      // Wrap init: 把 onDownloadProgress 同时接到面板进度条
      // （bar 的 fill 宽度 + 「加载中... X%」文本），每次 init 开始时归零。
      const origInit = instance.init?.bind(instance);
      if (typeof origInit === 'function') {
        instance.init = async (params?: any) => {
          const userCb = params?.onDownloadProgress;
          const next = params && typeof params === 'object' ? { ...params } : {};
          if (typeof userCb === 'function') {
            next.onDownloadProgress = (p: number) => {
              updateLoadingProgress(Math.min(100, Math.max(0, p)));
              userCb(p);
            };
          }
          updateLoadingProgress(0);
          return origInit(next);
        };
      }

      // Wrap destroy to auto-cleanup avatarManager state
      const origDestroy = instance.destroy.bind(instance);
      instance.destroy = async (...destroyArgs: any[]) => {
        const result = await origDestroy(...destroyArgs);
        avatarManager.clearAvatar();
        store.set({ avatar: null, sdkConnected: false, sdkStatus: 'offline' });
        store.log('info', '实例已销毁');
        return result;
      };

      return instance;
    };
    (window as any).XingyunAvatarAgent.prototype = AgentCtor.prototype;
  }

  try {
    const wrappedCode = `(async () => { ${code}\n})()`;
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('avatar', 'log', 'wait', wrappedCode);
    await fn(avatar, log, wait);
  } catch (err: any) {
    store.log('error', `执行错误: ${err.message || err}`);
  } finally {
    if (AgentCtor) {
      (window as any).XingyunAvatarAgent = AgentCtor;
    }
  }
}

/**
 * Reset the closure scope — call when instance config changes.
 */
export async function resetClosureScope(): Promise<void> {
  if (avatarManager.isConnected()) {
    await avatarManager.destroy('config_change');
  }
}