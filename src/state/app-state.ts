// ============================================
// Central State Store — Simple reactive store
// ============================================

import type { AppState, PrimaryTabId, LogEntry, TabState, AgentConfig } from '../types';
import { isThemeMode } from '../types';

type Listener = (state: AppState) => void;

const STORAGE_KEY = 'xingyun_teaching_state';

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: '',
  modelId: 'doubao-seed-2-0-mini-260428',
  asrSecretId: '',
  asrSecretKey: '',
  asrAppId: '',
  asrEngineModel: '16k_zh',
};

function loadPersistedState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      tabStates: data.tabStates || {},
      theme: isThemeMode(data.theme) ? data.theme : 'system',
      zoom: typeof data.zoom === 'number' ? data.zoom : 1,
      agentConfig: data.agentConfig,
    };
  } catch {
    return {};
  }
}

function createInitialState(): AppState {
  const persisted = loadPersistedState();
  return {
    sdkConnected: false,
    sdkStatus: 'offline',
    avatar: null,
    activePrimaryTab: 'init',
    activeSecondaryTab: '',
    drawerOpen: false,
    docsFullscreen: false,
    theme: isThemeMode(persisted.theme) ? persisted.theme : 'system',
    zoom: persisted.zoom ?? 1,
    tabStates: persisted.tabStates || {},
    logEntries: [],
    agentConfig: persisted.agentConfig || DEFAULT_AGENT_CONFIG,
  };
}

/** localStorage keys for persisted credentials. */
export const AGENT_CONFIG_STORAGE_KEY = 'xingyun_agent_config';
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

  // --- AgentConfig Helpers ---

  getAgentConfig(): AgentConfig {
    return { ...this.state.agentConfig };
  }

  setAgentConfig(partial: Partial<AgentConfig>) {
    const updated = { ...this.state.agentConfig, ...partial };
    this.set({ agentConfig: updated });
    // 同步写入独立键（兼容旧模板直接读 localStorage 的方式，供调试排查）
    try {
      localStorage.setItem(AGENT_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Replace all {{placeholder}} tokens in code with configured values.
   * Agent config comes from the store (with product defaults); appId/appSecret
   * come from the init-config storage. Unconfigured values are left as-is so
   * templates can detect them and show a friendly error.
   */
  injectPlaceholders(code: string): string {
    const cfg = this.getAgentConfig();
    const values: Record<string, string> = {
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      modelId: cfg.modelId,
      asrSecretId: cfg.asrSecretId,
      asrSecretKey: cfg.asrSecretKey,
      asrAppId: cfg.asrAppId,
      asrEngineModel: cfg.asrEngineModel,
    };
    try {
      const init = JSON.parse(localStorage.getItem(INIT_CONFIG_STORAGE_KEY) || '{}');
      values.appId = init.appId || '';
      values.appSecret = init.appSecret || '';
    } catch {}
    let result = code;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
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
        agentConfig: this.state.agentConfig,
      }));
    } catch {}
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const store = new Store();
