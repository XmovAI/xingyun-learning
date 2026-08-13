// ============================================
// Action Definitions — Button handlers per tab
// ============================================

import type { ActionButton } from '../types';
import { CODE_TEMPLATES } from './code-templates';
import { avatarManager } from '../core/avatar-manager';
import { store } from '../state/app-state';
import { setEditorCode, getEditorCode } from '../components/code-editor';
import { KA_ACTIONS, KA_INTENTS, EMOTIONS } from './ka-actions';
import { applyAvatarAspectRatio } from '../components/avatar-panel';

// --- Helper: Extract config values from current code and merge into template ---
const COMMON_KEYS = ['appId', 'appSecret', 'gatewayServer'] as const;

function extractConfig(code: string, key: string): string | null {
  const re = new RegExp(`${key}\\s*:\\s*['"]([^'"]*)['"]`);
  const m = code.match(re);
  return m ? m[1] : null;
}

function mergeConfig(template: string, currentCode: string): string {
  let result = template;
  for (const key of COMMON_KEYS) {
    const val = extractConfig(currentCode, key);
    // Skip `{{...}}` placeholders — treat them as "no cached value" and
    // keep the template's own default (e.g. the default gatewayServer).
    if (val !== null && !/^\{\{.*\}\}$/.test(val)) {
      const re = new RegExp(`(${key}\\s*:\\s*)['"][^'"]*['"]`);
      result = result.replace(re, `$1'${val}'`);
    }
  }
  // 保留已注入的 Widget 回调，避免在最简/完全配置之间切换时丢失
  for (const kind of Object.keys(WIDGET_OPTIONS) as WidgetCallbackKind[]) {
    if (currentCode.includes(WIDGET_OPTIONS[kind].key)) {
      result = injectWidgetOption(result, kind);
    }
  }
  return result;
}

// --- Widget 回调注入：将 onWidgetEvent / proxyWidget 片段注入创建实例代码的 options ---
type WidgetCallbackKind = 'onWidgetEvent' | 'proxyWidget';

const WIDGET_OPTIONS: Record<WidgetCallbackKind, { key: string; snippet: string }> = {
  onWidgetEvent: { key: 'onWidgetEvent', snippet: CODE_TEMPLATES.widgetOnEventOption },
  proxyWidget: { key: 'proxyWidget', snippet: CODE_TEMPLATES.widgetProxyOption },
};

function injectWidgetOption(code: string, kind: WidgetCallbackKind): string {
  const { key, snippet } = WIDGET_OPTIONS[kind];
  if (code.includes(key)) return code; // 已注入过，避免重复
  // 在 XmovAvatar options 对象闭合符 `});` 之前插入回调片段
  const idx = code.lastIndexOf('});');
  if (idx === -1) return code; // 未找到闭合符，放弃注入
  const before = code.slice(0, idx);
  const after = code.slice(idx);
  const gap = before.endsWith('\n') ? '' : '\n';
  return before + gap + snippet + '\n' + after;
}

/** 读取创建实例编辑器当前代码；编辑器未挂载时回退到持久化内容或默认模板 */
function getCreateInstanceCode(): string {
  return (
    getEditorCode('create-instance') ||
    store.getTabState('create-instance').code ||
    CODE_TEMPLATES.createInstance
  );
}

/** 写入创建实例编辑器；同时写 store，保证编辑器尚未挂载时注入也能生效 */
function setCreateInstanceCode(code: string) {
  store.setTabState('create-instance', { code });
  setEditorCode('create-instance', code);
}

// --- 初始化: 创建实例 ---
export const CREATE_INSTANCE_ACTIONS: ActionButton[] = [
  {
    id: 'aspect-select',
    label: '画幅',
    type: 'select',
    options: [
      { label: '横屏 16:9', value: '16/9' },
      { label: '竖屏 9:16', value: '9/16' },
    ],
    handler: (_ctx, selectedValue?: string) => {
      if (!selectedValue) return;
      applyAvatarAspectRatio(selectedValue);
    },
  },
  {
    id: 'simple-config',
    label: '最简配置',
    type: 'button',
    handler: (ctx) => {
      ctx.setCode(mergeConfig(CODE_TEMPLATES.createInstance, ctx.getCode()));
    },
  },
  {
    id: 'full-config',
    label: '完全配置',
    type: 'button',
    handler: (ctx) => {
      ctx.setCode(mergeConfig(CODE_TEMPLATES.createInstanceFull, ctx.getCode()));
    },
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => {
      if (avatarManager.isConnected()) {
        await avatarManager.destroy('recreate');
      }
      await ctx.executeCode();
    },
  },
];

// --- 初始化: 连接渲染 ---
export const CONNECT_RENDER_ACTIONS: ActionButton[] = [
  {
    id: 'connect',
    label: '连接',
    type: 'button',
    requiresAvatar: true,
    handler: (ctx) => {
      ctx.setCode(CODE_TEMPLATES.init);
    },
  },
  {
    id: 'destroy',
    label: '销毁',
    type: 'button',
    requiresAvatar: true,
    handler: (ctx) => {
      ctx.setCode(CODE_TEMPLATES.destroy);
    },
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    requiresAvatar: true,
    handler: async (ctx) => {
      const code = ctx.getCode();
      if (code.includes('.destroy(')) {
        await ctx.executeCode();
        return;
      }
      if (!avatarManager.getAvatar()) {
        ctx.log('请先在「创建实例」中创建实例');
        return;
      }
      await ctx.executeCode();
    },
  },
];

// --- 播报 ---
export const SPEAK_ACTIONS: ActionButton[] = [
  {
    id: 'normal',
    label: 'normal',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakNormal),
  },
  {
    id: 'ssml',
    label: 'ssml',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakSSML),
  },
  {
    id: 'stream',
    label: '流式',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakStream),
  },
  {
    id: 'extra',
    label: 'extra',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakExtra),
  },
  {
    id: 'interrupt',
    label: '打断',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakInterrupt),
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- SSML 基础 ---
export const SSML_ACTIONS: ActionButton[] = [
  {
    id: 'break',
    label: '停顿',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.ssmlBreak),
  },
  {
    id: 'phoneme',
    label: '注音',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.ssmlPhoneme),
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- KA 动作 ---
export const KA_ACTIONS_DEF: ActionButton[] = [
  {
    id: 'ka-select',
    label: 'KA动作',
    type: 'select',
    options: [
      { label: '── 关键动作 (ka) ──', value: '__ka_header' },
      ...KA_ACTIONS,
      { label: '── 动作意图 (ka_intent) ──', value: '__ki_header' },
      ...KA_INTENTS,
    ],
    handler: (ctx, selectedValue?: string) => {
      if (!selectedValue || selectedValue.startsWith('__')) return;

      const isKa = KA_ACTIONS.some(a => a.value === selectedValue);
      const template = isKa
        ? CODE_TEMPLATES.kaAction(selectedValue!)
        : CODE_TEMPLATES.kaIntent(selectedValue!);
      ctx.setCode(template);
    },
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    requiresAvatar: true,
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- 情绪 ---
export const EMOTION_ACTIONS: ActionButton[] = [
  {
    id: 'emotion-select',
    label: '情绪',
    type: 'select',
    options: EMOTIONS,
    handler: (ctx, selectedValue?: string) => {
      if (!selectedValue) return;
      ctx.setCode(CODE_TEMPLATES.emotion(selectedValue));
    },
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    requiresAvatar: true,
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- 隐身模式 ---
export const INVISIBLE_ACTIONS: ActionButton[] = [
  {
    id: 'toggle-invisible',
    label: '切换隐身',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.invisibleToggle),
  },
  {
    id: 'ui-visible',
    label: 'UI显隐',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.invisibleVisible),
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- 状态切换 ---
export const STATE_SWITCH_ACTIONS: ActionButton[] = [
  {
    id: 'state-idle',
    label: '空闲',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.stateIdle),
  },
  {
    id: 'state-interactive-idle',
    label: '交互空闲',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.stateInteractiveIdle),
  },
  {
    id: 'state-listen',
    label: '聆听',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.stateListen),
  },
  {
    id: 'state-interrupt',
    label: '语音打断',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.stateInterrupt),
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- 行走控制 ---
export const WALK_ACTIONS: ActionButton[] = [
  {
    id: 'define',
    label: '点位定义',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.walkDefine),
  },
  {
    id: 'walk',
    label: '行走',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.walkGo),
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- 布局配置 ---
export const LAYOUT_ACTIONS: ActionButton[] = [
  {
    id: 'config',
    label: '配置示例',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.layoutConfig),
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- Widget ---
export const WIDGET_ACTIONS: ActionButton[] = [
  {
    id: 'onWidgetEvent',
    label: 'onWidgetEvent',
    type: 'button',
    handler: async (ctx) => {
      if (avatarManager.isConnected()) {
        await avatarManager.destroy('widget_config');
      }
      setCreateInstanceCode(injectWidgetOption(getCreateInstanceCode(), 'onWidgetEvent'));
      ctx.navigateTab('init', 'create-instance');
    },
  },
  {
    id: 'proxyWidget',
    label: 'proxyWidget',
    type: 'button',
    handler: async (ctx) => {
      if (avatarManager.isConnected()) {
        await avatarManager.destroy('widget_config');
      }
      setCreateInstanceCode(injectWidgetOption(getCreateInstanceCode(), 'proxyWidget'));
      ctx.navigateTab('init', 'create-instance');
    },
  },
  {
    id: 'custom-event',
    label: '自定义事件',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.widgetCustomEvent),
  },
  {
    id: 'execute',
    label: '执行',
    type: 'button',
    handler: async (ctx) => await ctx.executeCode(),
  },
];

// --- 智能体: 文本对话 ---
export const AGENT_TEXT_ACTIONS: ActionButton[] = [
  {
    id: 'restore',
    label: '恢复代码',
    type: 'button',
    handler: (ctx) => {
      ctx.setCode(CODE_TEMPLATES.agentTextChat);
      ctx.store.setTabState('agent-text', { code: CODE_TEMPLATES.agentTextChat });
      ctx.log('已恢复为模板代码');
    },
  },
  { id: 'execute', label: '执行', type: 'button', handler: async (ctx) => {
    await ctx.executeCode();
  }},
];

// --- 智能体: 语音对话 ---
export const AGENT_VOICE_ACTIONS: ActionButton[] = [
  {
    id: 'restore',
    label: '恢复代码',
    type: 'button',
    handler: (ctx) => {
      ctx.setCode(CODE_TEMPLATES.agentVoiceChat);
      ctx.store.setTabState('agent-voice', { code: CODE_TEMPLATES.agentVoiceChat });
      ctx.log('已恢复为模板代码');
    },
  },
  { id: 'execute', label: '执行', type: 'button', handler: async (ctx) => {
    await ctx.executeCode();
  }},
];
