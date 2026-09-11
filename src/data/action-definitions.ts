// ============================================
// Action Definitions — Button handlers per tab
// ============================================

import type { ActionButton } from '../types';
import { CODE_TEMPLATES } from './code-templates';
import { avatarManager } from '../core/avatar-manager';
import { store } from '../state/app-state';
import { setEditorCode, getEditorCode } from '../components/code-editor';
import { executeCode } from '../core/code-executor';
import { KA_ACTIONS, KA_INTENTS, EMOTIONS } from './ka-actions';
import { applyAvatarAspectRatio } from '../components/avatar-panel';
import { showDemoPreview, hideDemoPreview, isDemoPreviewActive } from '../components/demo-preview';

// --- Helper: 模板合并（最简配置 / 完全配置）---
// 合并规则：
//   1) 表单配置的字段（{{appId}} / {{appSecret}} / {{gatewayServer}}）
//      在结果中**保留占位符**——值由「执行」时从表单注入，不把字面量烘焙进模板；
//   2) 其他字段（containerId / config / reconnect / 各类回调等）**保留当前代码中的值**；
//   3) 模板决定字段集合：完全配置的专属字段切换时自动带上，最简配置自动丢弃。
const FORM_FIELD_KEYS = new Set(['appId', 'appSecret', 'gatewayServer']);

/** 跳过字符串字面量/模板字符串（含转义与模板插值），返回结束索引（不含）。 */
function skipQuoted(text: string, i: number): number {
  const quote = text[i];
  i++;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === quote) return i + 1;
    if (quote === '`' && ch === '$' && text[i + 1] === '{') {
      let depth = 1;
      i += 2;
      while (i < text.length && depth > 0) {
        const c = text[i];
        if (c === '\\') { i += 2; continue; }
        if (c === '"' || c === "'" || c === '`') { i = skipQuoted(text, i); continue; }
        if (c === '{') depth++;
        else if (c === '}') depth--;
        i++;
      }
      continue;
    }
    i++;
  }
  return i;
}

/** 从某个 '{' 起始，返回匹配闭合 '}' 的结束索引（不含）。 */
function bracedEnd(text: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') { i = skipQuoted(text, i); continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
    i++;
  }
  return text.length;
}

/** 移除字符串外的行注释/块注释，避免注释干扰字段解析（保留注释行内换行）。 */
function stripComments(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const j = skipQuoted(text, i);
      out += text.slice(i, j);
      i = j;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? text.length : nl;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** 按 0 层逗号切分对象体（追踪 {} [] () 与字符串）。 */
function splitTopLevelEntries(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') { i = skipQuoted(text, i); continue; }
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
    i++;
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** 解析单条 `key: value` / `key(...) { ... }`，返回前置注释、key 与 value 文本。 */
function splitEntry(entry: string): { comment: string; key: string; value: string } {
  let rest = entry.trimStart();
  let comment = '';
  // 收集条目开头的行注释/块注释，保证切换模板时模板注释不丢失
  for (;;) {
    // 注释之间允许夹空行（如「省略基础配置」说明与字段注释之间的空行），空行本身不进入 comment
    const blank = rest.match(/^(?:[ \t]*\n)+[ \t]*/);
    if (blank) { rest = rest.slice(blank[0].length); continue; }
    const line = rest.match(/^\/\/[^\n]*(?:\n|$)/);
    if (line) { comment += line[0]; rest = rest.slice(line[0].length); continue; }
    const block = rest.match(/^\/\*[\s\S]*?\*\//);
    if (block) { comment += block[0]; rest = rest.slice(block[0].length); continue; }
    break;
  }
  rest = rest.trimStart();
  const m = rest.match(/^([A-Za-z_$][\w$]*)\s*(?=:|\()/);
  const key = m ? m[1] : '';
  const value = rest.slice(m ? m[0].length : 0).trimStart().replace(/^:/, '').trimStart();
  return { comment: comment.trimEnd(), key, value };
}

/** 递归合并对象：以模板字段为集合骨架，非表单字段取当前代码的值。indent 用于重建缩进。 */
function mergeObjectInner(templateInner: string, currentInner: string, indent: string): string {
  // current 代码先去掉注释再切分，便于拿到干净的 key/value
  const currentMap = new Map<string, string>();
  for (const entry of splitTopLevelEntries(stripComments(currentInner))) {
    const { key, value } = splitEntry(entry);
    if (key) currentMap.set(key, value);
  }

  const lines: string[] = [];
  for (const raw of splitTopLevelEntries(templateInner)) {
    const { comment, key, value } = splitEntry(raw);
    // 模板自带的注释（如「自动重连」）原样保留
    const prefix = comment ? `${indent}${comment}\n${indent}` : indent;
    if (!key) { lines.push(`${indent}${raw}`); continue; }
    // 表单字段：保留模板中的占位符（{{...}}），不取当前代码的字面量
    if (FORM_FIELD_KEYS.has(key)) { lines.push(`${indent}${raw}`); continue; }
    const currentValue = currentMap.get(key);
    if (currentValue === undefined) { lines.push(`${indent}${raw}`); continue; }
    if (value.trimStart().startsWith('{') && currentValue.trimStart().startsWith('{')) {
      const tInner = value.slice(1, bracedEnd(value, 0));
      const cInner = currentValue.slice(1, bracedEnd(currentValue, 0));
      const inner = mergeObjectInner(tInner, cInner, indent + '  ');
      lines.push(`${prefix}${key}: {\n${inner}\n${indent}}`);
    } else {
      // 保持模板中的方法简写/冒号形式
      const sep = value.trimStart().startsWith('(') ? '' : ': ';
      lines.push(`${prefix}${key}${sep}${currentValue.trimStart()}`);
    }
  }
  return lines.join(',\n');
}

/** 定位 new XingyunAvatarAgent({...}) 的 options 对象区间（不含外层花括号）。 */
function matchOptionsObject(code: string): { innerStart: number; innerEnd: number; inner: string } | null {
  const m = code.match(/new XingyunAvatarAgent\(/);
  if (!m) return null;
  let i = m.index! + m[0].length;
  while (i < code.length && /\s/.test(code[i])) i++;
  if (code[i] !== '{') return null;
  const start = i;
  const end = bracedEnd(code, start);
  if (end <= start + 1) return null;
  return { innerStart: start + 1, innerEnd: end, inner: code.slice(start + 1, end) };
}

function mergeConfig(template: string, currentCode: string, keepWidgets = true): string {
  const templateObj = matchOptionsObject(template);
  if (!templateObj) return template;
  const currentObj = matchOptionsObject(currentCode);
  if (!currentObj) return template;

  // options 对象最后一个字段重建后没有尾逗号（join 只负责字段之间的分隔），
  // 而结尾随后还要拼接 Widget 回调或直接闭合 })，缺逗号会直接产生语法错误，因此补上；
  // 闭合符 `})` 换行书写，避免出现 `},})` 挤在一行的写法。
  const mergedInner = mergeObjectInner(templateObj.inner, currentObj.inner, '  ');
  const innerOut = mergedInner.trimEnd().endsWith(',') ? mergedInner.trimEnd() : `${mergedInner.trimEnd()},`;
  let result = template.slice(0, templateObj.innerStart) + innerOut + '\n' + template.slice(templateObj.innerEnd);

  // 保留已注入的 Widget 回调（完全配置切换时带过去）；
  // 最简配置刻意不保留，「最简」= 仅模板字段，onWidgetEvent / proxyWidget 一并丢弃。
  if (keepWidgets) {
    for (const kind of Object.keys(WIDGET_OPTIONS) as WidgetCallbackKind[]) {
      if (currentCode.includes(WIDGET_OPTIONS[kind].key)) {
        result = injectWidgetOption(result, kind);
      }
    }
  }
  return result;
}

// --- Helper: 感知&大脑「初始化」—— 拼接实例创建配置 ---

/**
 * 提取片段代码开头的纯行注释块（若有），用于把自定义配置的安全提示注释
 * 保留到合并结果中。只取开头的连续注释行，遇到 `const avatar = ` 等声明即停。
 */
function fragmentLeader(code: string): string {
  const lead = code.match(/^(?:\s*\/\/[^\n]*\n)+/);
  return lead ? lead[0].trimEnd() + '\n\n' : '';
}

/**
 * 语义合并两个 `new XingyunAvatarAgent` options 对象体：
 * base 为骨架（保留其字段顺序与注释），fragment 覆盖/追加。
 * 同名对象字段（如 agentCallbacks / asr_config）递归合并；同名非对象字段 fragment 胜出。
 */
function mergeFragmentInner(baseInner: string, fragInner: string, indent: string): string {
  const fragRaw = splitTopLevelEntries(fragInner);
  const fragMap = new Map<string, { comment: string; key: string; value: string }>();
  for (const raw of fragRaw) {
    const e = splitEntry(raw);
    if (e.key) fragMap.set(e.key, e);
  }

  const baseKeys = new Set<string>();
  const lines: string[] = [];
  for (const raw of splitTopLevelEntries(baseInner)) {
    const { comment, key, value } = splitEntry(raw);
    if (!key) { lines.push(`${indent}${raw}`); continue; }
    baseKeys.add(key);
    const frag = fragMap.get(key);
    if (frag) {
      const useComment = frag.comment || comment;
      const prefix = useComment ? `${indent}${useComment}\n${indent}` : indent;
      if (value.trimStart().startsWith('{') && frag.value.trimStart().startsWith('{')) {
        const bInner = value.slice(1, bracedEnd(value, 0));
        const fInner = frag.value.slice(1, bracedEnd(frag.value, 0));
        const inner = mergeFragmentInner(bInner, fInner, indent + '  ');
        lines.push(`${prefix}${key}: {\n${inner}\n${indent}}`);
      } else {
        const sep = frag.value.trimStart().startsWith('(') ? '' : ': ';
        lines.push(`${prefix}${key}${sep}${frag.value.trimStart()}`);
      }
    } else {
      lines.push(`${indent}${raw}`);
    }
  }
  // 追加 fragment 独有字段
  for (const raw of fragRaw) {
    const e = splitEntry(raw);
    if (!e.key || baseKeys.has(e.key)) continue;
    const prefix = e.comment ? `${indent}${e.comment}\n${indent}` : indent;
    const sep = e.value.trimStart().startsWith('(') ? '' : ': ';
    lines.push(`${prefix}${e.key}${sep}${e.value.trimStart()}`);
  }
  return lines.join(',\n');
}

/**
 * 以 base（「创建实例」tab 代码）为骨架，把 fragment（当前 tab 示例代码）合并进 options。
 * 只拼接字段 + 覆盖，不重排 base 结构。
 */
function mergeFragments(baseCode: string, fragmentCode: string): string {
  const baseObj = matchOptionsObject(baseCode);
  const fragObj = matchOptionsObject(fragmentCode);
  if (!baseObj) return fragmentCode;
  if (!fragObj) return baseCode;
  const mergedInner = mergeFragmentInner(baseObj.inner, fragObj.inner, '  ');
  let result = baseCode.slice(0, baseObj.innerStart) + mergedInner + baseCode.slice(baseObj.innerEnd);
  const leader = fragmentLeader(fragmentCode);
  if (leader) result = leader + result;
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
  // 在 XingyunAvatarAgent options 对象闭合符 `});` 之前插入回调片段
  const idx = code.lastIndexOf('});');
  if (idx === -1) return code; // 未找到闭合符，放弃注入
  const before = code.slice(0, idx);
  const after = code.slice(idx);
  // options 对象最后一个字段若没带尾逗号（如 merge 产物），拼接新字段会直接语法错误，
  // 插入前先补逗号；已有逗号、或空对象（最后一个字符是 `{`）时不需要补
  const tail = before.replace(/\s+$/, '');
  const lastCh = tail.slice(-1);
  const comma = lastCh !== ',' && lastCh !== '{' ? ',' : '';
  return tail + comma + '\n' + snippet + '\n' + after;
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
      // 最简配置：仅保留最简模板的字段，已注入的 Widget 回调不保留
      ctx.setCode(mergeConfig(CODE_TEMPLATES.createInstance, ctx.getCode(), false));
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
    label: '纯文本',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakNormal),
  },
  {
    id: 'stream',
    label: '流式',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakStream),
  },
  {
    id: 'ssml',
    label: 'SSML',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakSSML),
  },
  {
    id: 'extra',
    label: '情绪',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.speakExtra),
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

// --- 智能体: 初始化（回调函数 / 自定义配置 / 重新加载）---
export const AGENT_INIT_ACTIONS: ActionButton[] = [
  {
    id: 'agent-callbacks',
    label: '回调函数',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.agentCallbacks),
  },
  {
    id: 'agent-custom-config',
    label: '调试用配置',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.agentCustomConfig),
  },
  {
    id: 'agent-asr-independent',
    label: 'ASR独立调用',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.agentASRIndependent),
  },
  {
    id: 'reload',
    label: '重新加载',
    type: 'button',
    handler: async (ctx) => {
      // 若当前为连接态，先销毁已有实例
      if (avatarManager.isConnected()) {
        await avatarManager.destroy('reload');
      }
      // 以「创建实例」tab 代码为 base，合并当前 tab 示例代码，完成实例创建配置
      const base = getCreateInstanceCode();
      const fragment = ctx.getCode() || CODE_TEMPLATES.agentCallbacks;
      const merged = mergeFragments(base, fragment);
      // 执行实例创建 + init，完成智能体重连
      await executeCode(merged + '\n\n' + CODE_TEMPLATES.reloadInit);
    },
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
    id: 'start-asr',
    label: '开始录音',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.agentVoiceStart),
  },
  {
    id: 'stop-asr',
    label: '停止录音',
    type: 'button',
    handler: (ctx) => ctx.setCode(CODE_TEMPLATES.agentVoiceStop),
  },
  { id: 'execute', label: '执行', type: 'button', handler: async (ctx) => {
    await ctx.executeCode();
  }},
];

// --- 智能体 Demo ---
// 示例代码中 `data-ratio` 与容器内联 `--rw/--rh` 决定画布比例
// （16:9 横屏 / 9:16 竖屏）。data-ratio 现只出现在容器 div 上、全局唯一；
// 内联变量才是实际驱动 CSS 的值，两者需同步更新。
const DEMO_RATIO_RE = /data-ratio="\d+\/\d+"/;
const DEMO_RATIO_STYLE_RE = /--rw:\s*\d+;\s*--rh:\s*\d+/;

export const DEMO_ACTIONS: ActionButton[] = [
  {
    id: 'demo-aspect',
    label: '横竖屏',
    type: 'select',
    options: [
      { label: '横屏 16:9', value: '16/9' },
      { label: '竖屏 9:16', value: '9/16' },
    ],
    handler: (ctx, selectedValue?: string) => {
      if (!selectedValue) return;
      const [rw, rh] = selectedValue.split('/');
      const code = ctx.getCode() || CODE_TEMPLATES.demoHtml;
      const next = code
        .replace(DEMO_RATIO_RE, `data-ratio="${selectedValue}"`)
        .replace(DEMO_RATIO_STYLE_RE, `--rw:${rw}; --rh:${rh}`);
      ctx.setCode(next);
      if (isDemoPreviewActive()) {
        // 预览中：用新比例重渲染 iframe
        showDemoPreview(store.injectPlaceholders(next));
        ctx.log(`已切换为 ${selectedValue}，并刷新预览`);
      } else {
        ctx.log(`已把代码中的画布比例更新为 ${selectedValue}（点击「预览」查看效果）`);
      }
    },
  },
  {
    id: 'demo-reset',
    label: '恢复代码',
    type: 'button',
    handler: (ctx) => {
      const original = CODE_TEMPLATES.demoHtml;
      ctx.setCode(original);
      if (isDemoPreviewActive()) {
        // 恢复代码时同步重渲染预览，保证代码与画布一致（与横竖屏刷新方式一致）
        showDemoPreview(store.injectPlaceholders(original));
        ctx.log('已恢复为原始示例代码，并刷新预览');
      } else {
        ctx.log('已把代码区恢复为原始示例代码');
      }
    },
  },
  {
    id: 'demo-preview',
    label: '预览',
    type: 'button',
    handler: async (ctx) => {
      if (isDemoPreviewActive()) {
        // 退出预览：清空 iframe，demo 实例销毁，画布归还教学区
        hideDemoPreview();
        ctx.log('已退出预览，画布归还教学区；回到「创建实例」执行可重新连接教学智能体');
        return;
      }
      // 进入预览：若教学实例处于连接态，先销毁（互斥）
      if (avatarManager.isConnected()) {
        await avatarManager.destroy('demo_preview');
      }
      const code = ctx.getCode() || CODE_TEMPLATES.demoHtml;
      // 注入「初始化」tab 保存的 appId / appSecret / gatewayServer
      showDemoPreview(store.injectPlaceholders(code));
      ctx.log('预览已打开：Demo 在 iframe 中独立运行（凭证已注入）；点击「预览」可退出');
    },
  },
  {
    id: 'demo-export',
    label: '导出',
    type: 'button',
    handler: (ctx) => {
      const code = ctx.getCode() || CODE_TEMPLATES.demoHtml;
      // 二次确认：导出的 HTML 会把当前配置的 AppId / AppSecret 写进文件
      const ok = window.confirm(
        '即将导出的 HTML 会把当前配置的 AppId / AppSecret 直接写入文件中。\n\n' +
        '该文件包含你的浏览器侧签名凭证，请务必妥善保管，不要发送给他人、上传公共仓库或部署到公开站点，以免凭证泄露导致额度被滥用。\n\n' +
        '确认导出？'
      );
      if (!ok) {
        ctx.log('已取消导出（不会写入凭证）');
        return;
      }
      // 注入「初始化」tab 保存的凭证，导出可直接使用的独立 HTML；
      // 不追加 data_source=2（该内部参数不落盘到导出的文件）
      const injected = store.injectPlaceholders(code, { withDataSource2: false });
      const blob = new Blob([injected], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent-demo.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      ctx.log('已导出 agent-demo.html（已写入 AppId / AppSecret）。⚠️ 该文件含签名凭证，请勿外传');
    },
  },
];
