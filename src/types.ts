// ============================================
// Xingyun SDK Teaching Project — Type Definitions
// ============================================

// --- SDK Global Declaration ---
declare global {
  interface Window {
    XingyunAvatarAgent: new (options: any) => any;
  }
}

export {};

// --- App State ---

/** Theme mode: fixed light/dark, or 'system' to follow the OS preference */
export type ThemeMode = 'dark' | 'light' | 'system';

/** Cycle order for the sidebar theme toggle */
export const THEME_MODES: ThemeMode[] = ['dark', 'light', 'system'];

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'dark' || v === 'light' || v === 'system';
}

export interface AppState {
  sdkConnected: boolean;
  sdkStatus: string;
  avatar: any | null;
  /** Whether the 智能体Demo preview iframe is currently shown */
  demoPreviewActive: boolean;
  activePrimaryTab: PrimaryTabId;
  activeSecondaryTab: string;
  drawerOpen: boolean;
  /** Whether a docs panel is currently in fullscreen mode */
  docsFullscreen: boolean;
  /** App color theme mode: 'dark' (default), 'light', or 'system' */
  theme: ThemeMode;
  /** Shared zoom factor (0.5 – 2) for code & docs, applied only in fullscreen */
  zoom: number;
  tabStates: Record<string, TabState>;
  logEntries: LogEntry[];
}

export type PrimaryTabId = 'init' | 'interaction' | 'agent' | 'agent-demo' | 'help';

export interface TabState {
  code: string;
}

export interface LogEntry {
  id: number;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'log';
  args: any[];
}

// --- Tab Definitions ---

export interface PrimaryTab {
  id: PrimaryTabId;
  label: string;
  requiresConnection: boolean;
  /** If set, the tab greys out and is not clickable until init config is saved */
  requiresConfig?: boolean;
  secondaryTabs: SecondaryTab[];
  /** Tabs not shown in the sidebar (e.g. the help drawer reached via its own button) */
  hidden?: boolean;
}

export interface SecondaryTab {
  id: string;
  label: string;
  /** If set, the secondary tab greys out and is not clickable until connected */
  requiresConnection?: boolean;
  modules: TabModule[];
}

export type TabModuleType = 'code' | 'actions' | 'log' | 'docs' | 'init-config';

export interface TabModule {
  type: TabModuleType;
  id: string;
  config?: any;
}

// --- Action Definition ---

export interface ActionButton {
  id: string;
  label: string;
  type: 'button' | 'select';
  options?: { label: string; value: string }[];
  handler: ActionHandler;
  /** If provided, button is disabled when this returns true */
  requiresAvatar?: boolean;
}

export type ActionHandler = (ctx: ActionContext, selectedValue?: string) => void | Promise<void>;

export interface ActionContext {
  setCode: (code: string) => void;
  getCode: () => string;
  executeCode: () => Promise<void>;
  log: (...args: any[]) => void;
  avatar: any | null;
  store: any;
  navigateTab: (primary: PrimaryTabId, secondary?: string) => void;
}
