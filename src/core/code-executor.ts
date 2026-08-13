// ============================================
// Code Executor — Closure-based sandboxed execution
// ============================================

import { store } from '../state/app-state';
import { avatarManager } from './avatar-manager';

/**
 * Execute code in a closure-based sandbox.
 *
 * Each execution runs in its own async IIFE, so `const` declarations
 * don't conflict across re-executions.
 *
 * When `new XmovAvatar(...)` is detected in the code, the resulting
 * instance is automatically registered with avatarManager, and the
 * `onStatusChange` callback is wrapped to sync connection state to the store.
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

  // Intercept `new XmovAvatar(...)`:
  // 1. Register instance with avatarManager
  // 2. Wrap onStatusChange to sync connection state
  const XmovAvatarCtor = (window as any).XmovAvatar;

  if (XmovAvatarCtor) {
    (window as any).XmovAvatar = function(options: any) {
      // Wrap onStatusChange to sync sdkConnected
      const userCallback = options?.onStatusChange;
      options = { ...options };
      options.onStatusChange = (status: any) => {
        // SDK status: 0 = online, 1 = offline, 4 = close, 5 = visible, 6 = invisible
        if (status === 0 || status === 'online' || status === 'visible') {
          avatarManager.setConnected(true);
          store.set({ sdkConnected: true, sdkStatus: 'online' });
        } else if (status === 1 || status === 'offline' || status === 'close') {
          avatarManager.setConnected(false);
          store.set({ sdkConnected: false, sdkStatus: 'offline' });
        }
        // Call user's original callback
        if (typeof userCallback === 'function') {
          userCallback(status);
        }
      };

      const instance = new XmovAvatarCtor(options);
      avatarManager.setAvatar(instance);

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
    (window as any).XmovAvatar.prototype = XmovAvatarCtor.prototype;
  }

  try {
    const wrappedCode = `(async () => { ${code}\n})()`;
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('avatar', 'log', 'wait', wrappedCode);
    await fn(avatar, log, wait);
  } catch (err: any) {
    store.log('error', `执行错误: ${err.message || err}`);
  } finally {
    if (XmovAvatarCtor) {
      (window as any).XmovAvatar = XmovAvatarCtor;
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
