// Reproduce the mergeConfig logic from src/data/action-definitions.ts (copied verbatim)
// plus the two template strings from src/data/code-templates.ts, and assert behavior.

// ---------- templates (copied) ----------
const createInstance = `// 创建端到端智能体（Agent）实例 —— 最简配置
const APP_ID = '{{appId}}';
const APP_SECRET = '{{appSecret}}';
const GATEWAY_SERVER = '{{gatewayServer}}';
if (APP_ID.startsWith('{{') || APP_SECRET.startsWith('{{')) {
  log('请先在「初始化」tab 配置 AppId 与 AppSecret');
  throw new Error('应用凭证未配置');
}
const avatar = new XingyunAvatarAgent({
  containerId: '#avatar-container',
  appId: APP_ID,
  appSecret: APP_SECRET,
  gatewayServer: GATEWAY_SERVER,
  onMessage(error) {
    log('SDK 错误:', error.code, error.message);
  },
  agentCallbacks: {
    onAgentStateChange(state) {
      log('Agent 状态:', state);
    },
    onConversationChange(event) {
      if (event.text) log('对话:', event.state, '·', event.text);
      else log('对话状态:', event.state);
    },
    onError(error) {
      log('Agent 错误:', error.domain, error.code, error.message);
    },
  },
});`;

const createInstanceFull = `// 创建端到端智能体（Agent）实例 —— 完整配置
const APP_ID = '{{appId}}';
const APP_SECRET = '{{appSecret}}';
const GATEWAY_SERVER = '{{gatewayServer}}';
if (APP_ID.startsWith('{{') || APP_SECRET.startsWith('{{')) {
  log('请先在「初始化」tab 配置 AppId 与 AppSecret');
  throw new Error('应用凭证未配置');
}
const avatar = new XingyunAvatarAgent({
  containerId: '#avatar-container',
  appId: APP_ID,
  appSecret: APP_SECRET,
  gatewayServer: GATEWAY_SERVER,
  // 客户端打断、运行时布局配置
  enableClientInterrupt: true,
  config: {
    layout: {
      container: { size: [360, 640] },
      avatar: { v_align: 'bottom', h_align: 'center', scale: '100vh', offset_x: 0, offset_y: 0 },
    },
    raw_audio: false,
  },
  // 自动重连
  reconnect: {
    enabled: true,
    maxAttempts: 6,
    initialDelayMs: 500,
    maxDelayMs: 8000,
  },
  onMessage(error) {
    log('SDK 错误:', error.code, error.message);
  },
  onStatusChange(status) {
    const STATUS_NAME = { 0: '在线', 1: '离线', 4: '关闭', 5: '可见', 6: '隐身' };
    log('连接状态:', STATUS_NAME[status] ?? '未知状态 (' + status + ')');
  },
  onNetworkInfo(info) {
    log('网络信息:', 'RTT=' + info.rtt + 'ms');
  },
  agentCallbacks: {
    onAgentStateChange(state) {
      log('Agent 状态:', state);
    },
    onASRStateChange(state) {
      log('ASR 状态:', state);
    },
    onASRResult(result) {
      log('ASR:', result.text, result.isFinal ? '(final)' : '');
    },
    onLLMResponse(resp) {
      if (resp.event === 'chunk') log('LLM:', resp.text);
    },
    onConversationChange(event) {
      if (event.text) log('对话:', event.state, '·', event.text);
      else log('对话状态:', event.state);
    },
    onError(error) {
      log('Agent 错误:', error.domain, error.code, error.message);
    },
  },
});`;

// 「回调函数」片段（复制自 code-templates.ts agentCallbacks）
const callbacksFragment = `// ASR / LLM 相关回调 —— 点击「重新加载」时合并进「创建实例」代码
const avatar = new XingyunAvatarAgent({
  // ...此处省略基础配置，基础配置使用\`初始化\`-\`创建实例\`中的配置

  agentCallbacks: {
    // 麦克风与识别状态
    onASRStateChange(state) {
      log('ASR 状态:', state);
    },
    // 识别结果（先临时后最终，isFinal=true 为稳定结果）
    onASRResult(result) {
      log('ASR:', result.text, result.isFinal ? '(final)' : '');
    },
    // LLM 流式文本
    onLLMResponse(resp) {
      if (resp.event === 'chunk') log('LLM:', resp.text);
    },
    onConversationChange(event) {
      if (event.text) log('对话:', event.state, '·', event.text);
      else log('对话状态:', event.state);
    },
    onError(error) {
      log('Agent 错误:', error.domain, error.code, error.message);
    },
  },
});`;

// 「自定义配置」片段（复制自 code-templates.ts agentCustomConfig）
const customConfigFragment = `// ⚠️ 安全提示：asr_config / brain_config 中包含访问凭证（api_key / secret_key），
// 仅用于测试或私有化部署环境，对外公开展示存在密钥泄露风险。
// 生产环境请在星云平台中配置。
const avatar = new XingyunAvatarAgent({
  // ...此处省略基础配置，基础配置使用\`初始化\`-\`创建实例\`中的配置

  // ASR 服务配置（测试 / 私有化部署专用）
  asr_config: {
    provider: 'xmov',                        // 或 doubao / tencent
    base_url: 'wss://你的ASR服务地址',
    headers: { app_id: '...', secret_key: '...' },
    request: { vad_tail_sil: 600 },          // 尾静音阈值 ms
  },
  // Brain/LLM 服务配置（测试 / 私有化部署专用）
  brain_config: {
    provider: 'openai_compatible',           // 或 anthropic / doubao / qwen / deepseek
    base_url: 'https://你的LLM服务地址',
    api_key: '...',
    model: 'your-model',
    preset: '你是魔珐星云小助手，请用简短友好的语气回复。',
    history_length: 5,
    extra_body: {},
  },
});`;

// 「ASR独立调用」片段（复制自 code-templates.ts agentASRIndependent）
const asrIndependentFragment = `// ASR 独立调用 —— 关闭「识别结果自动发大脑」，由业务手动判定
// 场景：语音识别只负责收集文本，是否发起 Brain 对话由规则自行决定。
// 用法：点击「重新加载」（重建实例并 init），再到「语音对话」点「开始录音」。
const avatar = new XingyunAvatarAgent({
  // ...此处省略基础配置，基础配置使用\`初始化\`-\`创建实例\`中的配置

  // 关闭自动送审：识别出的最终文本不会自动发给 LLM，等待应用自行调用 ask()
  features: {
    auto_send_asr_to_llm: false,
  },
  agentCallbacks: {
    onASRResult(result) {
      log('ASR:', result.text, result.isFinal ? '(final)' : '');
      if (!result.isFinal) return;             // 只处理稳定结果
      if (!result.text.startsWith('你好')) {
        log('非指令开头，不发起对话:', result.text);
        return;
      }
      // 命中「你好」前缀：去掉指令词，把问题本体交给 Brain
      const question = result.text.slice('你好'.length).trim();
      if (!question) {
        log('已识别到前缀，但缺少问题内容');
        return;
      }
      log('命中指令前缀，发起对话:', question);
      avatar.ask(question).catch((e) => log('对话失败:', e.message || e));
    },
  },
});`;

// ---------- helpers (copied from action-definitions.ts) ----------
const FORM_FIELD_KEYS = new Set(['appId', 'appSecret', 'gatewayServer']);

function skipQuoted(text, i) {
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

function bracedEnd(text, start) {
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

function stripComments(text) {
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

function splitTopLevelEntries(text) {
  const parts = [];
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

function splitEntry(entry) {
  let rest = entry.trimStart();
  let comment = '';
  // 收集条目开头的行注释/块注释（与 action-definitions.ts splitEntry 保持同步）
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

function mergeObjectInner(templateInner, currentInner, indent) {
  const currentMap = new Map();
  for (const entry of splitTopLevelEntries(stripComments(currentInner))) {
    const { key, value } = splitEntry(entry);
    if (key) currentMap.set(key, value);
  }

  const lines = [];
  for (const raw of splitTopLevelEntries(templateInner)) {
    const { comment, key, value } = splitEntry(raw);
    const prefix = comment ? `${indent}${comment}\n${indent}` : indent;
    if (!key) { lines.push(`${indent}${raw}`); continue; }
    if (FORM_FIELD_KEYS.has(key)) { lines.push(`${indent}${raw}`); continue; }
    const currentValue = currentMap.get(key);
    if (currentValue === undefined) { lines.push(`${indent}${raw}`); continue; }
    if (value.trimStart().startsWith('{') && currentValue.trimStart().startsWith('{')) {
      const tInner = value.slice(1, bracedEnd(value, 0));
      const cInner = currentValue.slice(1, bracedEnd(currentValue, 0));
      const inner = mergeObjectInner(tInner, cInner, indent + '  ');
      lines.push(`${prefix}${key}: {\n${inner}\n${indent}}`);
    } else {
      const sep = value.trimStart().startsWith('(') ? '' : ': ';
      lines.push(`${prefix}${key}${sep}${currentValue.trimStart()}`);
    }
  }
  return lines.join(',\n');
}

function matchOptionsObject(code) {
  const m = code.match(/new XingyunAvatarAgent\(/);
  if (!m) return null;
  let i = m.index + m[0].length;
  while (i < code.length && /\s/.test(code[i])) i++;
  if (code[i] !== '{') return null;
  const start = i;
  const end = bracedEnd(code, start);
  if (end <= start + 1) return null;
  return { innerStart: start + 1, innerEnd: end, inner: code.slice(start + 1, end) };
}

const widgetOnEventOption = `  onWidgetEvent(data) {
    log('Widget 事件:', data.type, data);
  },`;
const widgetProxyOption = `  proxyWidget: {
    subtitle_on(data) {
      log('Widget 字幕:', data.type, data);
    },
    show_image(data) {
      log('Widget 图片:', data.type, data);
    },
    show_video(data) {
      log('Widget 视频:', data.type, data);
    },
  },`;
const WIDGET_OPTIONS = {
  onWidgetEvent: { key: 'onWidgetEvent', snippet: widgetOnEventOption },
  proxyWidget: { key: 'proxyWidget', snippet: widgetProxyOption },
};
function injectWidgetOption(code, kind) {
  const { key, snippet } = WIDGET_OPTIONS[kind];
  if (code.includes(key)) return code;
  const idx = code.lastIndexOf('});');
  if (idx === -1) return code;
  const before = code.slice(0, idx);
  const after = code.slice(idx);
  // options 对象最后一个字段若没带尾逗号（如 merge 产物），拼接新字段会直接语法错误，
  // 插入前先补逗号；已有逗号、或空对象（最后一个字符是 `{`）时不需要补
  const tail = before.replace(/\s+$/, '');
  const lastCh = tail.slice(-1);
  const comma = lastCh !== ',' && lastCh !== '{' ? ',' : '';
  return tail + comma + '\n' + snippet + '\n' + after;
}

function mergeConfig(template, currentCode, keepWidgets = true) {
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
    for (const kind of Object.keys(WIDGET_OPTIONS)) {
      if (currentCode.includes(WIDGET_OPTIONS[kind].key)) {
        result = injectWidgetOption(result, kind);
      }
    }
  }
  return result;
}

// --- mergeFragments helpers (copied from action-definitions.ts) ---
// 用于「重新加载」：以「创建实例」代码为 base，合并当前 tab 的示例代码片段

/** 提取片段代码开头的纯行注释块（若有），遇到 `const avatar = ` 等声明即停。 */
function fragmentLeader(code) {
  const lead = code.match(/^(?:\s*\/\/[^\n]*\n)+/);
  return lead ? lead[0].trimEnd() + '\n\n' : '';
}

/** 语义合并两个 options 对象体：base 为骨架，fragment 覆盖/追加；同名对象字段递归合并。 */
function mergeFragmentInner(baseInner, fragInner, indent) {
  const fragRaw = splitTopLevelEntries(fragInner);
  const fragMap = new Map();
  for (const raw of fragRaw) {
    const e = splitEntry(raw);
    if (e.key) fragMap.set(e.key, e);
  }

  const baseKeys = new Set();
  const lines = [];
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

/** 以 base 为骨架，把 fragment 合并进 options；纯注释头部保留到结果最前。 */
function mergeFragments(baseCode, fragmentCode) {
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

// ---------- assertions ----------
let failed = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); }
  else { failed++; console.error('  ✗ FAIL: ' + msg); }
}
function has(result, needle, msg) {
  assert(result.includes(needle), `${msg}: 应当包含 ${JSON.stringify(needle)}`);
}
function lacks(result, needle, msg) {
  assert(!result.includes(needle), `${msg}: 应当不包含 ${JSON.stringify(needle)}`);
}

// --- 构造「用户改过的当前代码」 ---
// 最简基础上：用户改了 containerId、onMessage 函数体、onConversationChange，且 gateway 被表单同步成了顶部常量的字面量
const editedMinimal = createInstance
  .replace("containerId: '#avatar-container'", "containerId: '#my-minimal-container'")
  .replace(/log\('SDK 错误:', error\.code, error\.message\);\s*\}/, "log('MY error handler');\n    if (error) console.error(error);\n  }")
  .replace("else log('对话状态:', event.state);", "else log('MY conversation state:', event.state);")
  .replace("const GATEWAY_SERVER = '{{gatewayServer}}'", "const GATEWAY_SERVER = 'https://my-gateway.example.com/session'");

// 完全基础上：用户改了 containerId、reconnect.maxAttempts、onStatusChange 函数体
const editedFull = createInstanceFull
  .replace("containerId: '#avatar-container'", "containerId: '#my-full-container'")
  .replace('maxAttempts: 6', 'maxAttempts: 99')
  .replace("log('连接状态:', STATUS_NAME[status] ?? '未知状态 (' + status + ')');", "log('MY status:', STATUS_NAME[status] ?? status);");

console.log('== 场景1: 最简(已编辑) 点击最简配置 ==');
{
  const out = mergeConfig(createInstance, editedMinimal);
  has(out, "#my-minimal-container", 'containerId 保留用户值');
  has(out, "const GATEWAY_SERVER = '{{gatewayServer}}'", 'gatewayServer 恢复为占位符（不取表单字面量）');
  lacks(out, 'my-gateway.example.com', '不含被同步进代码的网关字面量');
  has(out, "log('MY error handler')", 'onMessage 函数体保留用户改动');
  has(out, 'MY conversation state', 'agentCallbacks.onConversationChange 保留用户改动');
  has(out, "appId: APP_ID", 'appId 保持 APP_ID 引用（占位符）');
  lacks(out, 'ASR_CONFIG', '最简不出现 ASR 相关字段');
  has(out, 'onAgentStateChange(state)', '保留模板 agentCallbacks');
  lacks(out, 'onASRStateChange', '最简不含 ASR 回调');
}

console.log('== 场景2: 最简(已编辑) 点击完全配置 ==');
{
  const out = mergeConfig(createInstanceFull, editedMinimal);
  has(out, "#my-minimal-container", 'containerId 保留用户值');
  has(out, "const GATEWAY_SERVER = '{{gatewayServer}}'", 'gatewayServer 为占位符');
  has(out, "log('MY error handler')", 'onMessage 函数体保留用户改动');
  has(out, 'MY conversation state', 'onConversationChange 保留用户改动');
  lacks(out, 'asr_config', '完全模板已不含 asr_config');
  lacks(out, 'brain_config', '完全模板已不含 brain_config');
  lacks(out, 'ASR_CONFIG', '完全模板已不含 ASR 配置常量');
  has(out, 'enableClientInterrupt: true', '新增 enableClientInterrupt');
  has(out, 'container: { size: [360, 640] }', '新增 config.layout');
  has(out, "scale: '100vh'", '新增 config.layout.avatar.scale 为视口高度字符串');
  lacks(out, 'scale: 1', '旧版数字 scale 不复存在');
  has(out, 'onStatusChange(status)', '新增 onStatusChange');
  has(out, 'onNetworkInfo(info)', '新增 onNetworkInfo');
  has(out, '// 自动重连', '保留模板注释「自动重连」');
  has(out, '// 客户端打断、运行时布局配置', '保留模板注释「客户端打断、运行时布局配置」');
  has(out, 'maxAttempts: 6', '新增 reconnect（模板默认值）');
  has(out, 'onASRStateChange(state)', '新增 ASR 回调');
  has(out, 'onASRResult(result)', '新增 ASR 结果回调');
  has(out, 'onLLMResponse(resp)', '新增 LLM 回调');
}

console.log('== 场景3: 完全(已编辑) 点击最简配置 ==');
{
  const out = mergeConfig(createInstance, editedFull);
  has(out, "#my-full-container", 'containerId 保留用户值');
  lacks(out, 'ASR_CONFIG', '丢弃 asr/brain 配置常量段');
  lacks(out, 'BRAIN_CONFIG', '丢弃 brain 配置常量段');
  lacks(out, 'asr_config', '丢弃 asr_config 字段');
  lacks(out, 'brain_config', '丢弃 brain_config 字段');
  lacks(out, 'enableClientInterrupt', '丢弃 enableClientInterrupt');
  lacks(out, 'onStatusChange(status)', '丢弃 onStatusChange');
  lacks(out, 'onNetworkInfo(info)', '丢弃 onNetworkInfo');
  lacks(out, '// 自动重连', '丢弃完全配置的重连注释');
  lacks(out, 'config: {', '丢弃 config 运行时配置');
  lacks(out, 'maxAttempts', '丢弃 reconnect（最简无此字段）');
  lacks(out, 'onASRStateChange', '丢弃 ASR 回调');
  lacks(out, 'onLLMResponse', '丢弃 LLM 回调');
  lacks(out, 'MY status', 'onStatusChange 被丢弃（不在最简字段集合）');
  // 但 agentCallbacks 里用户改的 onConversationChange 应保留
  has(out, "if (event.text) log('对话:', event.state, '·', event.text);", 'onConversationChange 保留模板默认（未被用户改过）');
}

console.log('== 场景5: 用户手工在代码里加回 asr_config/brain_config，切换模板一律清除 ==');
{
  const custom = editedMinimal.replace('});', `  asr_config: JSON.parse('{{asrConfig}}'),
  brain_config: JSON.parse('{{brainConfig}}'),
});`);
  const out = mergeConfig(createInstance, custom);
  lacks(out, 'asr_config', '最简模板清除用户手写的 asr_config');
  lacks(out, 'brain_config', '最简模板清除用户手写的 brain_config');
  lacks(out, '{{asrConfig}}', '占位符 {{asrConfig}} 一并清除');
  has(out, '#my-minimal-container', 'containerId 仍保留用户值');
}

console.log('== 场景4: 最简(已编辑+已注入 Widget) 点击最简/完全配置 ==');
{
  const withWidget = editedMinimal.replace('});', widgetOnEventOption + '\n});');
  // 最简配置：刻意不保留 Widget 回调（keepWidgets=false），仅模板字段
  const outS = mergeConfig(createInstance, withWidget, false);
  lacks(outS, 'onWidgetEvent(data)', '最简切换后 Widget 回调丢弃（仅模板字段）');
  lacks(outS, 'onWidgetEvent', '最简切换后不残留 onWidgetEvent');
  has(outS, '#my-minimal-container', '最简切换后 containerId 仍保留');
  // 完全配置：默认保留已注入的 Widget 回调
  const outF = mergeConfig(createInstanceFull, withWidget);
  has(outF, 'onWidgetEvent(data)', '完全切换后 Widget 回调保留');
  has(outF, '#my-minimal-container', '完全切换后 containerId 仍保留（含 Widget 注入的代码）');
}

console.log('== 场景5: 未改动的最简 → 完全 ==');
{
  const out = mergeConfig(createInstanceFull, createInstance);
  has(out, '#avatar-container', '默认 containerId');
  has(out, '// 自动重连', '模板注释保留');
}

console.log('== 场景6: 重新加载 —— 创建实例(最简) + 回调函数片段 ==');
{
  const out = mergeFragments(createInstance, callbacksFragment);
  has(out, '// ASR / LLM 相关回调', '片段纯注释头部保留到结果最前');
  has(out, '// 创建端到端智能体（Agent）实例 —— 最简配置', 'base 头部注释保留');
  has(out, "containerId: '#avatar-container'", 'base 字段保持不变');
  has(out, 'appId: APP_ID', 'base 凭证引用保留');
  assert(out.split('const avatar').length === 2, 'const avatar 只出现一次（片段声明被丢弃，仅合并 options）');
  has(out, 'onAgentStateChange(state)', 'base 独有回调保留');
  has(out, 'onASRStateChange(state)', '片段回调合并进 agentCallbacks');
  has(out, 'onASRResult(result)', '片段回调合并进 agentCallbacks');
  has(out, 'onLLMResponse(resp)', '片段回调合并进 agentCallbacks');
  has(out, '此处省略基础配置', '「省略基础配置」说明保留');
  has(out, '// 麦克风与识别状态', '片段回调注释保留');
  assert(
    out.indexOf('onConversationChange') < out.indexOf('onASRStateChange'),
    'base 原有字段在前、片段新字段追加在后（onConversationChange 位于 onASRStateChange 之前）'
  );
}

console.log('== 场景7: 重新加载 —— 创建实例(最简) + 自定义配置片段 ==');
{
  const out = mergeFragments(createInstance, customConfigFragment);
  has(out, '⚠️ 安全提示：asr_config / brain_config 中包含访问凭证', '安全提示首行保留');
  has(out, '生产环境请在星云平台中配置。', '安全提示末行保留');
  has(out, '此处省略基础配置', '「省略基础配置」说明随合并保留');
  has(out, 'asr_config: {', '合并 asr_config');
  has(out, "provider: 'xmov'", 'asr_config 内容保留');
  has(out, 'brain_config: {', '合并 brain_config');
  has(out, "api_key: '...'", 'brain_config 内容保留');
  has(out, '// ASR 服务配置（测试 / 私有化部署专用）', 'asr_config 注释保留');
  has(out, '// Brain/LLM 服务配置（测试 / 私有化部署专用）', 'brain_config 注释保留');
  has(out, "containerId: '#avatar-container'", 'base 字段仍保留');
  has(out, 'onAgentStateChange(state)', 'base agentCallbacks 不被自定义配置冲掉');
  lacks(out, 'ASR / LLM 相关回调', '回调片段的注释头不出现在自定义配置合并结果');
}

console.log('== 场景8: agentCallbacks 深合并 —— 片段覆盖同名、追加独有 ==');
{
  const frag = callbacksFragment.replace(
    "onConversationChange(event) {\n      if (event.text) log('对话:', event.state, '·', event.text);",
    "onConversationChange(event) {\n      log('FRAG 对话状态:', event.state);"
  );
  const out = mergeFragments(createInstance, frag);
  has(out, "log('FRAG 对话状态:', event.state)", '同名回调 agentCallbacks.onConversationChange 片段版本胜出');
  has(out, "log('Agent 状态:', state)", 'base 独有 onAgentStateChange 保留（并集）');
  has(out, "log('ASR 状态:', state)", '片段独有 onASRStateChange 追加（并集）');
  assert(out.indexOf('onConversationChange') < out.indexOf('onASRStateChange'), 'override 在原位、新增在末尾');
}

console.log('== 场景9: 重新加载 —— 创建实例(最简) + ASR独立调用片段 ==');
{
  const out = mergeFragments(createInstance, asrIndependentFragment);
  has(out, '// ASR 独立调用 —— 关闭「识别结果自动发大脑」，由业务手动判定', '片段纯注释头部保留到结果最前');
  has(out, '此处省略基础配置', '「省略基础配置」说明保留');
  has(out, 'features: {', '合并 features');
  has(out, 'auto_send_asr_to_llm: false', '关闭自动送审保留');
  has(out, 'onASRResult(result)', 'ASR 结果回调合并进 agentCallbacks');
  has(out, "containerId: '#avatar-container'", 'base 字段仍保留');
  assert(out.indexOf('agentCallbacks') < out.indexOf('features'), 'base 骨架（agentCallbacks）在前，片段独有字段（features）追加在后');
  const outReloadAI = mergeFragments(createInstance, asrIndependentFragment);
  assert(braceBalance(outReloadAI) === 0, `重新加载-ASR独立合并结果花括号配平（差值 ${braceBalance(outReloadAI)}，应为 0）`);
}

console.log('== 输出校验: 结果代码语法仍是完整模板结构 ==');
// 字符串感知的花括号配平（{{...}} 占位符在字符串内，不应计入）
function braceBalance(text) {
  let depth = 0;
  let i = 0;
  let min = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') { i = skipQuoted(text, i); continue; }
    if (ch === '{') { depth++; }
    else if (ch === '}') { depth--; min = Math.min(min, depth); }
    i++;
  }
  return depth;
}
{
  const out = mergeConfig(createInstanceFull, editedMinimal);
  assert(out.startsWith('// 创建端到端智能体（Agent）实例 —— 完整配置'), '结果以模板头部注释开头');
  assert(out.endsWith('});'), '结果以 }); 结尾');
  assert(braceBalance(out) === 0, `字符串外花括号配平（差值 ${braceBalance(out)}，应为 0）`);
  const outMin = mergeConfig(createInstance, editedMinimal);
  assert(braceBalance(outMin) === 0, `最简结果字符串外花括号配平（差值 ${braceBalance(outMin)}，应为 0）`);
  const outReloadFB = mergeFragments(createInstance, callbacksFragment);
  assert(braceBalance(outReloadFB) === 0, `重新加载-回调合并结果花括号配平（差值 ${braceBalance(outReloadFB)}，应为 0）`);
  const outReloadCC = mergeFragments(createInstance, customConfigFragment);
  assert(braceBalance(outReloadCC) === 0, `重新加载-自定义配置合并结果花括号配平（差值 ${braceBalance(outReloadCC)}，应为 0）`);
}

console.log('== 场景10: 尾逗号回归 —— merge 产物再拼接 Widget 回调不产生语法错误 ==');
{
  // 最简/完全配置示例代码 options 对象重建后，最后一个字段必须带尾逗号；
  // 否则在「Widget」tab 拼接 proxyWidget / onWidgetEvent 回调时会得到
  // `}` 与 `proxyWidget(` 直连的语法错误（本次修复的回归点）。
  const merged = mergeConfig(createInstance, editedMinimal);
  const mergedTail = merged.slice(0, merged.lastIndexOf('});')).replace(/\s+$/, '');
  assert(mergedTail.endsWith(','), 'merge 产物 options 末字段带尾逗号（可再拼接）');
  has(merged, '  },\n});', '尾逗号后换行再闭合（不出现 `,})` 挤在一行）');
  assert(braceBalance(merged) === 0, `merge 产物花括号配平（差值 ${braceBalance(merged)}，应为 0）`);

  // 用户操作路径：点一次「最简配置」后，直接注入 proxyWidget 回调
  const injected = injectWidgetOption(merged, 'proxyWidget');
  has(injected, 'proxyWidget: {', 'proxyWidget 回调已注入');
  lacks(injected, '}\n  proxyWidget', 'proxyWidget 前有逗号（不再出现缺逗号的直连）');
  const beforeProxy = injected.slice(0, injected.indexOf('proxyWidget')).replace(/\s+$/, '');
  assert(beforeProxy.endsWith(','), 'proxyWidget 拼接点前一个非空字符是逗号');
  assert(braceBalance(injected) === 0, `注入 proxyWidget 后花括号配平（差值 ${braceBalance(injected)}，应为 0）`);

  // 完全配置同样场景 + onWidgetEvent 回调
  const mergedFull = mergeConfig(createInstanceFull, editedFull);
  const injectedEvent = injectWidgetOption(mergedFull, 'onWidgetEvent');
  has(injectedEvent, 'onWidgetEvent(data)', 'onWidgetEvent 回调已注入');
  lacks(injectedEvent, '}\n  onWidgetEvent', 'onWidgetEvent 前有逗号');
  assert(braceBalance(injectedEvent) === 0, `注入 onWidgetEvent 后花括号配平（差值 ${braceBalance(injectedEvent)}，应为 0）`);

  // 变体：人工去掉尾逗号（等价于旧的缺逗号产物），injectWidgetOption 需自行补齐后再插入
  const stripped = merged.replace(/,\s*\}\);$/, '\n});');
  const reinjected = injectWidgetOption(stripped, 'onWidgetEvent');
  has(reinjected, 'onWidgetEvent(data)', '缺尾逗号时仍能注入 onWidgetEvent');
  lacks(reinjected, '}\n  onWidgetEvent', '缺尾逗号输入下 injectWidgetOption 自动补逗号');
  assert(braceBalance(reinjected) === 0, `补逗号后拼接结果花括号配平（差值 ${braceBalance(reinjected)}，应为 0）`);
}

console.log(failed === 0 ? '\n全部通过 ✓' : `\n${failed} 处失败 ✗`);
process.exit(failed === 0 ? 0 : 1);