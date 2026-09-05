// ============================================
// Central State Store — Simple reactive store
// ============================================

import type { AppState, PrimaryTabId, LogEntry, TabState } from '../types';
import { isThemeMode } from '../types';

type Listener = (state: AppState) => void;

const STORAGE_KEY = 'xingyun_teaching_state';

/** Agent 端到端会话接口地址（ttsa_v2）。未在初始化面板配置时使用该默认值。 */
export const DEFAULT_GATEWAY = 'https://nebula-agent.xingyun3d.com/user/v1/ttsa_v2/session';

function loadPersistedState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      tabStates: data.tabStates || {},
      theme: isThemeMode(data.theme) ? data.theme : 'system',
      zoom: typeof data.zoom === 'number' ? data.zoom : 1,
    };
  } catch {
    return {};
  }
}

/**
 * Escape a configured value so it is safe to splice into a single-quoted JS
 * string literal inside a template (e.g. `const ASR_CONFIG = '...'`).
 * JSON config strings are free-text; users may paste pretty-printed JSON with
 * literal newlines, and values may contain quotes or backslashes.
 */
function escapeJsString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

function createInitialState(): AppState {
  const persisted = loadPersistedState();
  return {
    sdkConnected: false,
    sdkStatus: 'offline',
    avatar: null,
    demoPreviewActive: false,
    activePrimaryTab: 'init',
    activeSecondaryTab: '',
    drawerOpen: false,
    docsFullscreen: false,
    theme: isThemeMode(persisted.theme) ? persisted.theme : 'system',
    zoom: persisted.zoom ?? 1,
    tabStates: persisted.tabStates || {},
    logEntries: [],
  };
}

/** localStorage keys for persisted credentials. */
export const INIT_CONFIG_STORAGE_KEY = 'xingyun_init_config';

class Store {
  private state: AppState = createInitialState();
  private listeners: Set<Listener> = new Set();
  private logIdCounter = 0;

  get(): AppState {
    return this.state;
  }

  set(partial: Partial<AppState>) {
    this.state = { ...this.state, ...partial };
    this.persist();
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // --- Tab State Helpers ---

  getTabState(tabId: string): TabState {
    return this.state.tabStates[tabId] || { code: '' };
  }

  setTabState(tabId: string, partial: Partial<TabState>) {
    const current = this.getTabState(tabId);
    const updated = { ...current, ...partial };
    const tabStates = { ...this.state.tabStates, [tabId]: updated };
    this.set({ tabStates });
  }

  // --- Init Config Helpers ---

  /**
   * 当前保存的 gatewayServer；未配置时回退到默认 ttsa_v2 地址。
   */
  getGatewayServer(): string {
    try {
      const init = JSON.parse(localStorage.getItem(INIT_CONFIG_STORAGE_KEY) || '{}');
      return init.gatewayServer || DEFAULT_GATEWAY;
    } catch {
      return DEFAULT_GATEWAY;
    }
  }

  /**
   * 是否已保存 appId + appSecret（判定「初始化 → 创建实例」配置是否就绪）。
   */
  hasInitConfig(): boolean {
    try {
      const init = JSON.parse(localStorage.getItem(INIT_CONFIG_STORAGE_KEY) || '{}');
      return !!(init.appId && init.appSecret);
    } catch {
      return false;
    }
  }

  /**
   * 展示层兼容：把旧快照中内联的 gatewayServer 值（占位符或旧字面量）替换为表单当前值。
   * 新模板以顶部 const GATEWAY_SERVER = '{{gatewayServer}}' 占位（与 appId/appSecret 一致），
   * 编辑器中保持占位符、仅在「执行」时注入，因此本方法对新模板不再生效。
   */
  resolveGatewayDisplay(code: string): string {
    const gateway = escapeJsString(this.getGatewayServer());
    return code.replace(/(gatewayServer\s*:\s*['"])[^'\n]*?(['"])/g, `$1${gateway}$2`);
  }

  /**
   * Replace all {{placeholder}} tokens in code with configured values.
   * appId / appSecret / gatewayServer come from the init-config storage;
   * gatewayServer falls back to the default ttsa_v2 endpoint.
   * Unconfigured values are left as-is so templates can detect them and show a
   * friendly error.
   */
  injectPlaceholders(code: string): string {
    const values: Record<string, string> = {
      gatewayServer: '',
    };
    try {
      const init = JSON.parse(localStorage.getItem(INIT_CONFIG_STORAGE_KEY) || '{}');
      values.appId = init.appId || '';
      values.appSecret = init.appSecret || '';
    } catch {}
    values.gatewayServer = this.getGatewayServer();
    let result = code;
    for (const [key, value] of Object.entries(values)) {
      const safe = escapeJsString(value);
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value ? safe : `{{${key}}}`);
    }
    return result;
  }

  // --- Log Helpers ---

  log(level: LogEntry['level'], ...args: any[]) {
    const entry: LogEntry = {
      id: ++this.logIdCounter,
      timestamp: Date.now(),
      level,
      args,
    };
    this.set({ logEntries: [...this.state.logEntries, entry] });
  }

  clearLog() {
    this.set({ logEntries: [] });
  }

  // --- Navigation ---

  navigateTab(primary: PrimaryTabId, secondary?: string) {
    this.set({
      activePrimaryTab: primary,
      drawerOpen: true,
      ...(secondary ? { activeSecondaryTab: secondary } : {}),
    });
  }

  // --- Private ---

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tabStates: this.state.tabStates,
        theme: this.state.theme,
        zoom: this.state.zoom,
      }));
    } catch {}
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const store = new Store();
