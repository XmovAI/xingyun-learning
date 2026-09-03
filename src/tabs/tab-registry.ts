// ============================================
// Tab Registry — All tab definitions
// ============================================

import type { PrimaryTab, SecondaryTab } from '../types';
import {
  CREATE_INSTANCE_ACTIONS,
  CONNECT_RENDER_ACTIONS,
  SPEAK_ACTIONS,
  KA_ACTIONS_DEF,
  EMOTION_ACTIONS,
  INVISIBLE_ACTIONS,
  STATE_SWITCH_ACTIONS,
  WALK_ACTIONS,
  LAYOUT_ACTIONS,
  WIDGET_ACTIONS,
  AGENT_INIT_ACTIONS,
  AGENT_TEXT_ACTIONS,
  AGENT_VOICE_ACTIONS,
  DEMO_ACTIONS,
} from '../data/action-definitions';
import { CODE_TEMPLATES } from '../data/code-templates';

// --- Invite code (?inviteCode=) appended to the "前置准备" docs ---
// Rendered as raw HTML inside the markdown (marked passes tags through), so the
// code must be HTML-escaped before embedding to avoid URL-driven injection.
const INVITE_SUFFIX = (() => {
  const code = new URLSearchParams(window.location.search).get('inviteCode')?.trim() ?? '';
  if (!code) return '';
  return `，使用邀请码 <mark>${escapeHtml(code.slice(0, 64))}</mark>，获赠额外积分`;
})();

function escapeHtml(s: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

// --- Docs Content ---
const DOCS = {
  prerequisite: `![星云 End-to-End AI Screen Platform 架构](${import.meta.env.BASE_URL}agent-architecture.png)

星云是一个端到端 AI 屏幕平台：覆盖 **多模态感知 → 专属智脑 → 多模态表达 → AI 端渲** 的完整闭环，能力通过 SDK 支撑实现，适配**固定屏幕**、**移动屏幕**与**机器人**三类终端。

## 前置准备

在接入星云 **端到端 SDK（XingyunAvatarAgent）** 之前，你需要完成以下准备工作。

### 1. 注册与获取凭证

1. 访问 [魔珐星云平台](https://xingyun3d.com/) 注册账号${INVITE_SUFFIX}
2. 创建一个**驱动应用**，选择角色、音色、表演风格
3. 获取 **App ID** 和 **App Secret** —— SDK 初始化的必填凭证，用于身份识别和请求签名
4. 取得 **gatewayServer**（Agent 会话接口地址），公共网关填写为\`https://nebula-agent.xingyun3d.com/user/v1/ttsa_v2/session\`

### 2. 环境要求

| 要求 | 详情 |
|------|------|
| **浏览器** | Chrome 94+ / Edge 94+ / Safari 15+ / Firefox 100+（推荐 Chrome 以获得最佳性能） |
| **WebGL** | 需要 WebGL 2.0 支持 |
| **网络** | 需要稳定的 WebSocket 连接 |
| **容器** | 需要一个有明确宽高的 DOM 容器元素用于挂载 Canvas |
| **麦克风** | 使用语音识别时，页面须运行在 HTTPS 或 localhost 并获得麦克风权限 |
| **芯片** | x86 架构芯片；ARM 架构芯片：RK3588 建议清晰度 1080P，RK3566 建议清晰度 720P |

### 3. SDK 安装

两种引入方式，任选其一：

**方式一：CDN 引入（本教学项目采用）**

在 HTML 中用 \`<script>\` 标签加载**最新版**的端到端 SDK，加载后自动暴露全局变量 \`window.XingyunAvatarAgent\`：

\`\`\`html
<script src="https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar_e2e@latest.js"></script>
\`\`\`

本教学项目已在 \`index.html\` 中引入上述地址，代码里可直接 \`new XingyunAvatarAgent(...)\`，无需额外安装。

**方式二：npm 引入（推荐用于正式工程）**

\`\`\`bash
pnpm add @xmov/avatar@latest
# 或 npm install @xmov/avatar@latest
\`\`\`

\`\`\`javascript
import XingyunAvatarAgent from "@xmov/avatar/agent";
\`\`\`

### 4. 核心能力概览

- **端到端具身智能体**：在数字人渲染之上闭环「感知 → 认知 → 表达」（ASR 语音识别 + LLM Brain 对话 + 数字人播报）
- **文本对话**：\`ask()\` 发起 Brain 对话，支持多轮问答
- **语音交互**：\`startASR()\` / \`stopASR()\` 采集麦克风并由平台 ASR 识别，识别结果实时回调
- **直接播报**：\`speak()\` 支持 SSML、动作、情绪、Widget
- **实时 3D 数字人渲染**：基于 WebGL 的 GPU 加速渲染，支持面部表情、口型、骨骼动画的实时驱动
- **状态与回调和断线重连**：Agent / ASR / 对话状态机 + 自动重连
`,

  createInstance: `## 创建数字人实例

使用 \`new XingyunAvatarAgent(options)\` 创建**端到端数字人（Agent）**实例。构造函数接受一个 \`options\` 配置对象。

### 必填参数

| 参数 | 类型 | 说明 |
|------|------|------|
| \`containerId\` | \`string\` | 数字人容器 CSS 选择器，如 \`#avatar-container\` |
| \`appId\` | \`string\` | 应用 ID，由平台分配 |
| \`appSecret\` | \`string\` | 应用密钥，由平台分配（浏览器侧签名凭证） |
| \`gatewayServer\` | \`string\` | Agent 会话接口完整地址（**ttsa_v2 版本**） |
| \`onMessage\` | \`(error) => void\` | Avatar / 会话 / 渲染错误回调，**必须实现** |

> gatewayServer 与旧版不同：端到端 SDK 使用 \`https://nebula-agent.xingyun3d.com/user/v1/ttsa_v2/session\`（路径升级为 \`ttsa_v2\`）。「初始化」面板已预填该默认地址。

### Agent 参数（项目方提供）

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| \`asr_config\` | \`object\` | 无 | ASR 服务配置（**可选**）。不配置时使用平台默认；自定义 provider / base_url / headers / request 时传入 |
| \`brain_config\` | \`object\` | 无 | Brain/LLM 服务配置（**可选**）。不配置时使用平台默认；自定义 provider / base_url / api_key / model / preset / history_length / extra_body 时传入 |
| \`reconnect\` | \`object\` | 开启 | 自动重连（enabled / maxAttempts / initialDelayMs / maxDelayMs） |
| \`features\` | \`object\` | 无 | 增强功能开关（识别结果自动进 Brain \`auto_send_asr_to_llm\`、抗干扰语义判断 \`anti_interference\`、语音前处理 \`speech_frontend\`、VAD 合并 \`vad_merge_mode\` 等） |
| \`extras\` | \`object\` | 无 | 与服务端约定的业务扩展参数 |
| \`session_speak_req_id\` | \`0 \\| 1\` | \`1\` | 会话是否包含开场白 |
| \`audio.inputEnabled\` | \`boolean\` | \`false\` | 初始化后是否立即开启音频输入 |

### 回调：agentCallbacks

Agent 专属回调组，与旧版顶层回调并存：

| 回调 | 类型 | 说明 |
|------|------|------|
| \`onAgentStateChange\` | \`(state) => void\` | Agent 状态：idle / initializing / ready / running / reconnecting / stopped / destroyed / failed |
| \`onASRStateChange\` | \`(state) => void\` | 麦克风与识别状态：idle / requesting-permission / starting / listening / stopping / failed |
| \`onASRResult\` | \`({ text, isFinal }) => void\` | 识别文本（先临时后最终，isFinal=true 为稳定结果） |
| \`onLLMResponse\` | \`({ event, text? }) => void\` | LLM 流式文本（chunk / done） |
| \`onConversationChange\` | \`({ state, text? }) => void\` | 对话主状态：idle / asking / speaking-directly / speaking / completed / interrupted / failed |
| \`onSpeakStateChange\` | \`({ state }) => void\` | 播报状态 |
| \`onSemanticJudgeResult\` | \`({ query, meaningful, action }) => void\` | 抗干扰语义判断结果 |
| \`onSocketStateChange\` | \`(state) => void\` | E2E 连接状态 |
| \`onError\` | \`(error) => void\` | Agent / ASR / Brain / 网络 / 配额错误 |

> **AgentError** 结构：\`{ code: string, message: string, domain: 'permission'\|'network'\|'asr'\|'brain'\|'ttsa'\|'quota'\|'sdk', retryable?, cause? }\`。需与 \`onMessage\`（Avatar/会话/渲染错误）并行处理。

### 常用参数

端到端 SDK 支持下列常用参数：\`config\`（运行时配置）、\`enableClientInterrupt\`、顶层回调 \`onStatusChange\` / \`onRenderChange\` / \`onVoiceStateChange\` / \`onWalkStateChange\` / \`onWidgetEvent\` / \`proxyWidget\` / \`onNetworkInfo\`。

### 占位符

创建实例代码中的 \`{{gatewayServer}}\` 会**实时同步**「初始化」表单的 Gateway Server 输入（保存/清空即生效，未配置时显示默认 ttsa_v2 地址）；\`{{appId}}\` / \`{{appSecret}}\` 会在「执行」时自动注入。下面表单保存后即可运行。

工具栏的「最简配置」/「完全配置」用于切换模板：**表单配置的字段（appId / appSecret / gatewayServer）恢复为 \`{{占位符}}\`**，不在代码里烘焙字面量；**其余字段保留当前代码的值**（如你改过的 containerId、回调函数体、reconnect 参数），模板只决定字段集合——切到完全会补上 config、reconnect、onStatusChange 等，切回最简会移除它们。你要改的任何非表单字段在切换后都还在。
`,

  connectRender: `## 连接与销毁

### init() — 初始化

初始化 Agent：下载数字人资源、建立会话与连接。参数可选（\`onDownloadProgress\` 上报 0–100 进度）。**Promise 返回时 Agent 即为 \`running\`**，可直接发起对话 / ASR：

\`\`\`javascript
await avatar.init();
log('Agent 状态:', avatar.getAgentState());   // running
\`\`\`

\`init()\` 失败会拒绝 Promise，此时应销毁实例后重建，不要直接复用失败实例。

### destroy() — 销毁

销毁实例，释放麦克风、连接与数字人资源。调用后实例不可再初始化或复用：

\`\`\`javascript
await avatar.destroy('user_action');
\`\`\`

页面退出 / 组件卸载时应调用 \`destroy()\`，只删除容器无法释放麦克风与连接资源。

### Agent 状态机

页面能否发起对话，以 **\`running\`** 为准：

\`\`\`text
idle → initializing → ready → running（可对话 / ASR） ↔ reconnecting
                        │
                        ↓
             destroyed / failed（不可恢复）
\`\`\`

| 状态 | 建议 |
|------|------|
| \`initializing\` / \`ready\` | 显示加载状态，禁用对话与 ASR |
| \`running\` | 允许发起对话与 ASR |
| \`reconnecting\` | 禁用新操作，提示连接恢复中 |
| \`failed\` / \`destroyed\` | 展示错误并重建实例 |

### 状态控制方法

行为状态 \`idle()\` / \`interactiveidle()\` / \`listen()\`、查询 \`getStatus()\` / \`getRenderState()\` / \`getSessionId()\`、会话 \`offlineMode()\` / \`onlineMode()\` / \`reStartSession()\` 在端到端 SDK 中同样可用。

### 断线重连

端到端 SDK 内置自动重连（默认开启，可用构造参数 \`reconnect\` 配置 maxAttempts 等）。重连期间状态为 \`reconnecting\`；SDK 不会重放断线前的文本、打断或音频，恢复到 \`running\` 后由业务决定是否重新发起操作。断线前正在运行的 ASR 不会自动恢复，需重新 \`startASR()\`。
`,

  speak: `## 播报

播报由 \`speak()\` 驱动，支持 SSML、动作、情绪、Widget 等能力。

\`speak()\` **返回只表示已发起**，不表示播报完成；播报结束靠 \`agentCallbacks.onSpeakStateChange\` / \`onConversationChange\` 判断。

### SSML 播报

\`\`\`javascript
avatar.speak('<speak>大家好！<break time="500ms"/>欢迎来到魔珐星云。</speak>');
\`\`\`

### 流式播报

分段发送长文本，使用 \`is_start\` / \`is_end\` 标记边界：

\`\`\`javascript
avatar.speak('<speak>这是第一句话。</speak>', true, false);
avatar.speak('<speak>这是第二句话。</speak>', false, false);
avatar.speak('<speak>这是最后一句话。</speak>', false, true);
\`\`\`

### 带情绪播报

\`\`\`javascript
avatar.speak('<speak>太棒了！</speak>', true, true, { emotion: 'happy' });
\`\`\`

### 打断 — interrupt()

\`interrupt(type)\` 立即打断当前播报，返回打断耗时（毫秒）。构造参数 \`enableClientInterrupt\` 默认开启，打断由客户端本地处理、时延最短：

\`\`\`javascript
const latency = avatar.interrupt('speak');
log('打断耗时:', latency, 'ms');
\`\`\`

> \`type\` 为打断来源标签（\`'user'\` / \`'user_speaking'\` / \`'user_click'\` / \`'speak'\` / \`'in_offline_mode'\`），不影响打断行为。打断不会自动关闭 ASR；需要结束监听时再调用 \`stopASR()\`。

### speak() 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| \`ssml\` | \`string\` | 是 | SSML 格式的文本 |
| \`is_start\` | \`boolean\` | 否 | 是否为本次说话的第一段（默认 true） |
| \`is_end\` | \`boolean\` | 否 | 是否为本次说话的最后一段（默认 true） |
| \`extra\` | \`object\` | 否 | 额外参数，如 \`{ emotion: 'happy' }\` |
`,

  stateSwitch: `## 状态切换

数字人支持多种行为状态。以下状态方法在端到端 SDK 中同样可用（调用后会同步通知服务端）。

### 状态一览

| 方法 | 状态 | 说明 |
|------|------|------|
| \`idle()\` | 空闲 Idle | 停止当前动作，进入静默待机动画 |
| \`interactiveidle()\` | 交互空闲 Interactive Idle | 表示数字人处于可交互的等待状态 |
| \`listen()\` | 聆听 Listen | 表示数字人正在聆听用户输入 |
| \`speak(...)\` | 说话 Speak | 播报（详见「播报」Tab） |

### 典型流程

\`\`\`javascript
avatar.listen();                                // 用户开始输入
avatar.speak('<speak>这是回复内容</speak>');    // AI 回复到达，开始说话
avatar.interactiveidle();                       // 说话结束，回到交互空闲
\`\`\`

### 语音打断

\`interrupt(type)\` 打断当前播报，返回打断耗时（毫秒）。构造参数 \`enableClientInterrupt\` 默认开启；打断不会自动关闭 ASR / 麦克风，需要结束监听时再调用 \`stopASR()\`。

\`\`\`javascript
// 先播放一段长语音，停留 2 秒后打断
avatar.speak('<speak>这是一段较长的语音，用来演示打断效果。</speak>');
await wait(2);
const latency = avatar.interrupt('user');
log('打断耗时:', latency, 'ms');
\`\`\`

> \`interrupt(type)\` 的 \`type\` 参数为打断来源标签（\`'user'\` / \`'user_speaking'\` / \`'user_click'\` / \`'speak'\` / \`'in_offline_mode'\`），除 \`'in_offline_mode'\` 外行为完全相同，仅用于日志区分。

### Agent / ASR 状态查询

\`\`\`javascript
const agentState = avatar.getAgentState();       // running / stopped / failed / ...
const asrState   = avatar.getASRState();         // idle / requesting-permission / listening / ...
const status     = avatar.getStatus();           // 状态码：0=在线, 1=离线, 4=关闭, 5=可见, 6=隐身
const renderState = avatar.getRenderState();     // 渲染状态：init / rendering / pausing / paused / resumed / stopped
log('Agent:', agentState, 'ASR:', asrState, '状态:', status, '渲染:', renderState);
\`\`\`
`,

  ka: `## 关键动作 (KA)

KA = Key Action，数字人的预设肢体动作。通过 SSML 中的 \`<ue4event>\` 标签嵌入，数字人会在播报**对应文本的同时**做出动作。

> 关键动作不是客户端 API，而是通过 SSML 标签下发给**服务端**处理。服务端在合成语音的同时驱动数字人做出肢体动作。端到端 SDK 同样支持该能力，通过 \`speak()\` 交互式驱动。

### 两种类型

| 类型 | SSML 标签 | 说明 |
|------|-----------|------|
| \`ka\` | \`<type>ka</type>\` | 预设编排动作（\`RightSide02\` / \`LeftSide\` / \`Elevate\` / \`KeyPoints\` 等） |
| \`ka_intent\` | \`<type>ka_intent</type>\` | AI 实时生成的语义动作（\`Pointscreen\` 等），后端自动匹配最合适的 KA |

### 预设关键动作 (ka)

\`\`\`xml
<speak>
  真的特别感谢大家。
  <ue4event>
    <type>ka</type>
    <data>
      <action_semantic>RightSide02</action_semantic>
    </data>
  </ue4event>
  大家可以看向右上方。
</speak>
\`\`\`

### 动作意图 (ka_intent)

\`\`\`xml
<ue4event>
  <type>ka_intent</type>
  <data>
    <ka_intent>Pointscreen</ka_intent>
  </data>
</ue4event>
\`\`\`

### 时间线规则

动作标签放在**哪句文本前面**，数字人就**边说那句话边做动作**。文本说完，动作也结束。

> ⚠️ 距离过近的 ka 会被忽略。

\`\`\`xml
<speak>
  第一句话没有动作。
  <ue4event><type>ka</type><data><action_semantic>Elevate</action_semantic></data></ue4event>
  第二句话伴随抬手动作。
  <ue4event><type>ka</type><data><action_semantic>KeyPoints</action_semantic></data></ue4event>
  第三句话伴随抓重点手势。
</speak>
\`\`\`

### 在 speak() 中使用

\`\`\`javascript
const ssml = \`
<speak>
  大家好，
  <ue4event><type>ka</type><data><action_semantic>KeyPoints</action_semantic></data></ue4event>
  今天有三个重点要跟大家分享。
</speak>\`;
avatar.speak(ssml);
\`\`\`

> ⚠️ KA 是**定制化功能**，需要角色制作时预置动作编排。
`,

  emotion: `## 情绪

情绪分为**面部表情**和**音色情感**两个维度，通过 \`speak()\` 的 \`extra.emotion\` 参数统一控制。

### 两种触发方式

| 方式 | 触发方法 | 效果 |
|------|----------|------|
| **显式传参** | \`extra.emotion\` 指定情感标签 | **强制**使用指定情绪，无论文本内容如何 |
| **文本推测** | 不传 \`emotion\` | 大模型根据文本语义**自动推测**并匹配表情和音色 |

**显式传参**示例：

\`\`\`javascript
// 文本说"好悲伤"，但 emotion 传了 happy → 数字人会开心地说这句话
avatar.speak('<speak>好悲伤啊...</speak>', true, true, { emotion: 'happy' });
\`\`\`

**文本推测**示例：

\`\`\`javascript
// 不传 emotion → 服务端从"太棒了"推断出 happy，自动匹配开心表情
avatar.speak('<speak>太棒了！通过了！</speak>');
\`\`\`

### 常用情绪标签

\`emotion\` 字段接受**任意字符串**，没有固定枚举值：

| emotion | 效果 |
|---------|------|
| \`happy\` | 开心 / 积极 |
| \`sad\` | 悲伤 / 低落 |
| \`angry\` | 生气 / 严肃 |
| \`surprised\` | 惊讶 |
| \`neutral\` | 中性 / 默认 |

### 与关键动作的区别

| 能力 | 控制方式 | 作用域 |
|------|----------|--------|
| **表情**（emotion） | \`speak()\` 的 \`extra.emotion\` 参数 | 整句说话的语调和面部表情 |
| **关键动作**（KA） | SSML 中的 \`<ue4event>\` 标签 | 特定时刻的肢体手势 |

两者可以组合使用：

\`\`\`javascript
const ssml = \`
<speak>
  <ue4event><type>ka</type><data><action_semantic>Elevate</action_semantic></data></ue4event>
  欢迎大家来到今天的发布会！
</speak>\`;
// 关键动作（抬手） + 开心表情
avatar.speak(ssml, true, true, { emotion: 'happy' });
\`\`\`

> ⚠️ 表情属于**定制化功能**，需要角色制作时预置表情数据。
`,

  invisible: `## 隐身模式

隐身模式用于在不需要数字人画面时暂停渲染、节省 CPU/GPU 资源。端到端 SDK 提供两种可见性 API：

### 两种可见性 API 对比

| API | 效用 | 后端推送 | 渲染 | 音频 |
|-----|------|----------|------|------|
| \`switchInvisibleMode()\` | 隐身/恢复，通知后端 | 暂停/恢复 | 暂停/恢复 | 静音/恢复 |
| \`changeAvatarVisible(visible)\` | 纯 UI 隐藏/显示 | 不受影响 | 继续渲染 | 继续播放 |

### 切换隐身

\`\`\`javascript
avatar.switchInvisibleMode();   // 进入隐身
avatar.switchInvisibleMode();   // 退出隐身（自动 listen）
\`\`\`

### 纯 UI 隐藏

\`\`\`javascript
avatar.changeAvatarVisible(false);  // 隐藏 Canvas（渲染仍在进行）
avatar.changeAvatarVisible(true);   // 重新显示
\`\`\`

### 使用场景

| 场景 | 推荐 API |
|------|----------|
| 用户最小化窗口/切到后台 | \`switchInvisibleMode()\` — 节省资源 |
| 仅需隐藏画面、保留音频 | \`changeAvatarVisible(false)\` |
`,

  walk: `## 行走动画

行走动画允许数字人在水平方向上移动位置，适用于虚拟展厅、引导讲解等场景。端到端 SDK 支持配置点位，并在播报 SSML 中触发行走。

> ⚠️ 行走属于**定制化功能**，需要角色制作时预置行走动画数据。

### 配置行走点位

\`\`\`javascript
avatar.changeWalkConfig({
  walk_points: { F: 0, G: 100, H: 200, I: 300, J: 400, K: 500, L: 600, M: 700 },
  init_point: 700,
});
\`\`\`

| 属性 | 类型 | 说明 |
|------|------|------|
| \`walk_points\` | \`{ [key: string]: number }\` | 停靠点名称与 x 坐标的映射 |
| \`init_point\` | \`number\` | 初始停靠点坐标 |

### SSML 触发行走

配置好点位后，在 SSML 中嵌入行走命令：

\`\`\`xml
<speak>
  先看左边。
  <ue4event>
    <type>walk</type>
    <data><target>F</target></data>
  </ue4event>
  再看看右边。
  <ue4event>
    <type>walk</type>
    <data><target>K</target></data>
  </ue4event>
  我走过来了。
</speak>
\`\`\`

| 属性 | 说明 |
|------|------|
| \`<type>\` | 固定为 \`walk\` |
| \`<target>\` | 目标点位标签，必须在 \`walk_points\` 中存在 |

### 边走边说

行走标签放在文本前面，数字人会边走边播报紧随其后的句子：

\`\`\`javascript
const ssml = \`
<speak>
  <ue4event><type>walk</type><data><target>G</target></data></ue4event>
  我正在走过来。
</speak>\`;
avatar.speak(ssml);
\`\`\`

### 监听行走状态

\`\`\`javascript
onWalkStateChange(state) {
  if (state === 'start') console.log('数字人开始行走');
  if (state === 'end') console.log('数字人到达目的地');
}
\`\`\`

> ⚠️ 必须先调用 \`changeWalkConfig()\` 配置好点位，再发行走 SSML。\`target\` 必须在 \`walk_points\` 中存在；\`changeWalkConfig()\` 仅在数字人**非行走状态**下生效，正在行走时调用不生效。
`,

  layout: `## 布局配置

Layout 配置控制数字人在容器中的位置和大小。可静态传入 \`config.layout\` 构造参数，或运行时调用 \`changeLayout()\` 动态修改。

### Layout 接口

\`\`\`typescript
interface Layout {
  container: { size: number[] };     // [width, height]
  avatar: {
    v_align: 'top' | 'center' | 'bottom';   // 垂直对齐
    h_align: 'left' | 'center' | 'right';   // 水平对齐
    scale: number | string;  // 缩放比例（数字或 '40vh'）
    offset_x: number;        // 水平偏移（像素）
    offset_y: number;        // 垂直偏移（像素）
  };
}
\`\`\`

### scale 取值说明

| 格式 | 示例 | 说明 |
|------|------|------|
| 数字 | \`0.4\` | 基于素材分辨率的缩放比例。如 1080×1920 下 \`scale=0.4\` → 数字人大小为 432×768 |
| vh 字符串 | \`"40vh"\` | 相对容器高度的缩放。如容器高 810、素材高 1920，\`"40vh"\` → 实际 scale ≈ 0.169 |

### 运行时动态修改

\`\`\`javascript
avatar.changeLayout({
  container: { size: [360, 640] },
  avatar: {
    v_align: 'center',
    h_align: 'center',
    scale: 0.8,
    offset_x: 0,
    offset_y: -20,
  },
});
\`\`\`

### 构造时配置

\`\`\`javascript
const avatar = new XingyunAvatarAgent({
  // ...
  config: {
    layout: {
      container: { size: [360, 640] },
      avatar: { v_align: 'bottom', h_align: 'center', scale: 1, offset_x: 0, offset_y: 0 },
    },
  },
});
\`\`\`

### 其他 config 配置项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| \`raw_audio\` | \`boolean\` | 是否使用 PCM 原始音频模式（默认 false，使用 MSE） |
| \`walk_config\` | \`WalkConfig\` | 行走动画配置，详见行走 Tab |
| \`init_events\` | \`Array\` | 初始化时渲染的 UI 组件事件列表 |
`,

  widget: `## Widget 自定义渲染

Widget 机制允许在数字人播报过程中渲染图片、视频、链接等多媒体元素。通过构造参数 \`onWidgetEvent\` / \`proxyWidget\` 接收 Widget 事件并自行渲染。

### 两种回调方法

| 方法 | 说明 | 优先级 |
|------|------|--------|
| \`onWidgetEvent(data)\` | 接收**所有**事件 | 更高 |
| \`proxyWidget\` | 按组件类型注册回调 | 较低 |

> 两者都定义时，\`onWidgetEvent\` 优先级更高。

### onWidgetEvent 示例

\`\`\`javascript
onWidgetEvent(data) {
  console.log('Widget 事件:', data.type, data);
  switch (data.type) {
    case 'subtitle_on':  updateSubtitle(data.text); break;
    case 'subtitle_off': hideSubtitle(); break;
    case 'widget_pic':   showPicture(data.image); break;
  }
}
\`\`\`

### proxyWidget 示例

\`\`\`javascript
proxyWidget: {
  subtitle_on(data)  { updateSubtitle(data.text); },
  subtitle_off(data) { hideSubtitle(); },
  widget_pic(data)   { showPicture(data.image); },
  custom_card(data)  { renderCustomCard(data); },
}
\`\`\`

> 注册后该类型的事件**不会**走 SDK 内置渲染器。未注册类型的事件仍走 \`onWidgetEvent\`。

### SDK 内置事件

| 事件 type | 说明 | 数据字段 |
|-----------|------|----------|
| \`subtitle_on\` | 显示字幕 | \`data.text\` |
| \`subtitle_off\` | 隐藏字幕 | — |
| \`widget_pic\` | 显示图片 | \`data.image\` |

### 自定义事件类型

通过 SSML \`<uievent>\` 标签下发，客户端通过回调接收并自行渲染：

| 事件 type | 说明 | 关键数据字段 |
|-----------|------|-------------|
| \`show_image\` | 图片卡片 | \`image\`, \`title\` |
| \`show_video\` | 视频播放 | \`video\`, \`cover\`, \`title\` |
| \`show_link\` | 链接卡片 | \`url\`, \`title\`, \`description\`, \`image\` |
| \`show_text\` | 文本卡片 | \`title\`, \`text_content\` |
| \`show_model3d\` | 3D 模型 | \`model_url\`, \`title\` |
| \`bgm_start\` | 背景音乐 | \`src\`, \`title\`, \`bgm_loop\`, \`bgm_volume\` |

### 自定义事件 SSML 示例

\`\`\`xml
<speak>
  请看大屏幕。
  <uievent>
    <type>show_image</type>
    <data>
      <image>https://example.com/scene.png</image>
      <title>办公室场景</title>
    </data>
  </uievent>
</speak>
\`\`\`

### 多控件组合

一条 SSML 可以同时嵌入多个 \`<uievent>\`，依次触发：

\`\`\`xml
<speak>
  <uievent><type>show_image</type><data><image>https://example.com/1.png</image><title>图片1</title></data></uievent>
  首先展示图片。
  <uievent><type>show_video</type><data><video>https://example.com/demo.mp4</video><cover>https://example.com/c.jpg</cover><title>视频</title></data></uievent>
  接着播放视频。
</speak>
\`\`\`
`,

  agentInit: `## 初始化

「感知&大脑」的入口：配置 ASR / Brain 相关回调与自定义服务，并通过「重新加载」一键重建实例、完成 init 连接。ASR 与 Brain 默认使用**平台预置配置**，无需额外配置即可跑通文本 / 语音对话。

> 本 Tab 需要先创建实例并连接成功后才可进入（未连接时「感知&大脑」在侧边栏置灰、不可点击）。

### 使用流程

1. **回调函数**：在下方代码编辑器填充 ASR / LLM 相关回调（\`onASRStateChange\` / \`onASRResult\` / \`onLLMResponse\` 等），并入 \`agentCallbacks\`
2. **自定义配置**：填充 \`asr_config\` / \`brain_config\` 示例（仅测试 / 私有化部署环境使用）
3. **重新加载**：以「创建实例」tab 的代码为基础，合并当前编辑器中的示例代码完成实例创建配置；若当前为连接态，先销毁已有实例，再执行实例创建 + init，完成数字人重连

### ASR 独立调用

「ASR独立调用」按钮演示**识别与对话解耦**：构造时设置 \`features.auto_send_asr_to_llm: false\`，关闭「识别结果自动发给 LLM」，由应用在 \`onASRResult\` 中自行判定是否发起 \`ask()\`。示例识别到文本以「你好」开头时才把问题交给 Brain（自动剥离指令前缀），否则只记录日志不发起对话。适用于需要自行筛选、节流或改写的语音触发场景。

### 回调说明

| 回调 | 说明 |
|------|------|
| \`onASRStateChange\` | 麦克风与识别状态：listening / stopping / failed 等 |
| \`onASRResult\` | 识别文本：临时结果 \`isFinal:false\`，稳定结果 \`isFinal:true\` |
| \`onLLMResponse\` | LLM 流式文本（\`event: 'chunk' / 'done'\`） |
| \`onConversationChange\` | 对话主状态：idle / asking / speaking-directly / speaking / completed / interrupted / failed |
| \`onError\` | Agent / ASR / Brain / 网络 / 配额错误 |

### 安全提示

> ⚠️ **asr_config / brain_config 仅用于测试与私有化部署环境。**其中包含访问凭证（\`api_key\` / \`secret_key\`），对外公开展示存在密钥泄露风险。生产环境请在星云平台应用管理中配置。
`,

  agentText: `## 文本对话

端到端 SDK 将文本对话集成在 \`ask()\` 中：**输入文本 → Brain 对话 → 数字人播报**，无需自己拼接 LLM HTTP 请求。

### 基本用法

\`\`\`javascript
await avatar.ask('介绍一下这个产品');
\`\`\`

\`ask()\` 要求 Agent 处于 \`running\`；返回表示已成功发起，**不表示播报结束**，播报完成靠 \`agentCallbacks.onConversationChange\` / \`onSpeakStateChange\` 判断。

### 与 speak() 的区别

| 方法 | 是否走 Brain | 适用场景 |
|------|-------------|----------|
| \`ask()\` | 是 | 问答、多轮交互、数字人自主加工内容 |
| \`speak()\` | 否 | 固定话术、把外部系统结论直接说出来 |

### 多轮对话

Brain 会根据 \`brain_config.history_length\` 保留多轮上下文；每轮 \`ask()\` 都会带上历史进行推理，适合连续对话场景。

### 实现要点

1. 用 \`prompt()\` 获取用户输入文本（也可直接传固定文本）
2. \`await avatar.ask(input)\` 发起对话
3. 观察日志面板的 \`onConversationChange\`（asking → speaking → completed）与 \`onASRResult\` / \`onLLMResponse\` 回调

> Brain 服务默认使用平台配置（无需额外设置）；如需自定义 provider，可在「感知&大脑 → 初始化」tab 点击「自定义配置」并「重新加载」。

### 代码模板

右侧代码编辑器已经为你准备了一段完整的实现。点击「执行」按钮运行即可体验。
`,

  agentVoice: `## 语音对话

端到端 SDK 的语音交互由**平台 ASR** 完成：**麦克风录音（startASR）→ 平台识别 → 识别结束自动进入 Brain → 数字人播报**。不需要自己引入第三方语音识别 SDK。

本 tab 提供「开始录音」/「停止录音」/「执行」三个按钮：前两者分别在编辑器中填充对应的示例代码，点击「执行」运行即可。

### 基本用法

\`\`\`javascript
// 开始识别（申请麦克风权限 + 流式识别）
await avatar.startASR();
// 识别文本通过 agentCallbacks.onASRResult 实时回调：
//   { text: '...', isFinal: false }  ← 临时结果
//   { text: '...', isFinal: true }   ← 最终结果（稳定，可提交业务）
// 结束本轮识别并释放麦克风
await avatar.stopASR();
\`\`\`

### 使用要点

1. **必须在用户操作中调用 \`startASR()\`**（如按钮点击、本页「执行」按钮触发的代码），浏览器才会允许麦克风权限
2. 页面须运行在 HTTPS 或 localhost
3. 录音期间可伴随数字人播报，\`interrupt(type)\` 只打断播报、不会自动关闭 ASR；要结束监听需再调用 \`stopASR()\`
4. 识别是**异步回调**驱动：参考日志面板的 \`onASRStateChange\`（listening / stopping / failed）与 \`onASRResult\`

### 识别后自动对话

识别结束（\`isFinal: true\`）后默认**自动进入 Brain 对话链路**：识别文本交给大模型，数字人播报回复，无需手动再调 \`ask()\`。该行为由构造参数 \`features.auto_send_asr_to_llm\` 控制，默认 \`true\`：

\`\`\`javascript
// 识别结束自动走通「感知 → 认知 → 表达」，播报结果通过 onConversationChange / onLLMResponse 观察
await avatar.startASR();
\`\`\`

若关闭该开关（\`auto_send_asr_to_llm: false\`），识别只产出文本，需要对话时再手动把最终文本交给 \`ask()\`（见「文本对话」Tab）。

### ASR 识别参数

ASR 服务（provider、base_url、vad 尾静音等）默认使用平台配置，一般无需改动。断线恢复后 ASR 不会自动重启，需要重新 \`startASR()\`。
`,

  usage: `
<button type="button" class="action-btn action-btn--primary" data-guide-replay>重看引导提示</button>

## 使用说明

本教学系统用于动手体验「魔珐星云」端到端具身智能 SDK（\`XingyunAvatarAgent\`）：在左侧边栏选择功能模块，在代码编辑框修改代码，点击「执行」按钮运行，结果与日志显示在下方日志面板。

### 基本流程

1. **选择 Tab**：左侧边栏按「初始化 → 表达 → 感知&大脑 → 智能体Demo」的顺序学习
2. **查看说明**：每个 Tab 顶部的文档介绍该能力的用法
3. **编辑代码**：编辑框已预置示例代码，可直接修改
4. **执行**：点击「执行」按钮运行，日志输出到下方面板
5. **观察**：数字人实时响应，日志面板展示状态变化与回调

> ⚠️ 「表达」，以及「感知&大脑」需要先创建实例并连接成功才能使用（未连接时对应 Tab 会置灰、不可点击）。

### 代码编辑框特定用法

#### 1. \\{\\{变量\\}\\} 占位符

代码中的 \`{{变量名}}\` 会在点击「执行」时**自动替换**为你在表单里保存的凭证：

| 占位符 | 来源 |
|--------|------|
| \`{{appId}}\` / \`{{appSecret}}\` | 初始化 · 创建实例配置表单（执行时注入） |
| \`{{gatewayServer}}\` | 初始化 · Gateway Server（保存后立即同步到代码） |

未配置的占位符**保持原样**（如 \`{{appId}}\`），预置模板会检测到并用 \`log()\` 提示你先去配置。\`{{gatewayServer}}\` 未配置时自动使用默认的 ttsa_v2 地址，代码中会直接显示该地址。

#### 2. async 执行

代码运行在 **async 上下文**中，可以直接 \`await\` 异步方法，无需手动包裹 \`async\` 函数：

\`\`\`javascript
await avatar.init();
await avatar.speak('你好！');
\`\`\`

#### 3. 预置方法

每次「执行」的代码中都注入以下变量/方法：

| 名称 | 类型 | 说明 |
|------|------|------|
| \`avatar\` | 对象 | 当前数字人实例（未连接时为 \`null\`） |
| \`log(...args)\` | 函数 | 输出到日志面板；多参数空格拼接，对象自动 JSON 格式化 |
| \`wait(seconds)\` | 函数 | 等待指定秒数，返回 Promise，需 \`await\` |

\`\`\`javascript
log('开始');                  // 普通文本
log('进度:', 42, '%');        // 多参数
log('对象:', { a: 1 });       // 对象自动序列化
await wait(1.5);              // 等待 1.5 秒
\`\`\`

#### 4. 其他提示

- 每次「执行」都是**独立作用域**，\`const\` 声明不会与上次运行冲突
- 执行出错时，错误信息会显示在日志面板
- 代码编辑框支持 **⛶ 全屏**，全屏后可用 **− / 100% / +** 缩放字号
`,
};

// --- Build Tab Definitions ---

function buildSecondaryTab(
  id: string,
  label: string,
  modules: SecondaryTab['modules'],
  requiresConnection = false
): SecondaryTab {
  return { id, label, requiresConnection: requiresConnection || undefined, modules };
}

export const TAB_DEFINITIONS: PrimaryTab[] = [
  // ===== 初始化 =====
  {
    id: 'init',
    label: '初始化',
    requiresConnection: false,
    secondaryTabs: [
      buildSecondaryTab('prerequisite', '前置准备', [
        { type: 'docs', id: 'prerequisite-docs', config: { content: DOCS.prerequisite, title: '前置准备' } },
      ]),
      buildSecondaryTab('create-instance', '创建实例', [
        { type: 'docs', id: 'create-instance-docs', config: { content: DOCS.createInstance, title: '创建实例' } },
        { type: 'init-config', id: 'init-config-form' },
        { type: 'code', id: 'create-instance', config: { defaultCode: CODE_TEMPLATES.createInstance } },
        { type: 'actions', id: 'create-instance', config: { buttons: CREATE_INSTANCE_ACTIONS } },
        { type: 'log', id: 'create-instance-log' },
      ]),
      buildSecondaryTab('connect-render', '连接/销毁', [
        { type: 'docs', id: 'connect-render-docs', config: { content: DOCS.connectRender, title: '连接/销毁' } },
        { type: 'code', id: 'connect-render', config: { defaultCode: CODE_TEMPLATES.init } },
        { type: 'actions', id: 'connect-render', config: { buttons: CONNECT_RENDER_ACTIONS } },
        { type: 'log', id: 'connect-render-log' },
      ]),
    ],
  },
  // ===== 表达 =====
  {
    id: 'interaction',
    label: '表达',
    requiresConnection: true,
    secondaryTabs: [
      buildSecondaryTab('speak', '播报', [
        { type: 'docs', id: 'speak-docs', config: { content: DOCS.speak, title: '播报' } },
        { type: 'code', id: 'speak', config: { defaultCode: CODE_TEMPLATES.speakNormal } },
        { type: 'actions', id: 'speak', config: { buttons: SPEAK_ACTIONS } },
        { type: 'log', id: 'speak-log' },
      ]),
      buildSecondaryTab('ka', 'KA', [
        { type: 'docs', id: 'ka-docs', config: { content: DOCS.ka, title: '关键动作' } },
        { type: 'code', id: 'ka', config: { defaultCode: CODE_TEMPLATES.kaAction('RightSide02') } },
        { type: 'actions', id: 'ka', config: { buttons: KA_ACTIONS_DEF } },
        { type: 'log', id: 'ka-log' },
      ]),
      buildSecondaryTab('emotion', '情绪', [
        { type: 'docs', id: 'emotion-docs', config: { content: DOCS.emotion, title: '情绪' } },
        { type: 'code', id: 'emotion', config: { defaultCode: CODE_TEMPLATES.emotion('happy') } },
        { type: 'actions', id: 'emotion', config: { buttons: EMOTION_ACTIONS } },
        { type: 'log', id: 'emotion-log' },
      ]),
      buildSecondaryTab('invisible', '隐身', [
        { type: 'docs', id: 'invisible-docs', config: { content: DOCS.invisible, title: '隐身模式' } },
        { type: 'code', id: 'invisible', config: { defaultCode: CODE_TEMPLATES.invisibleToggle } },
        { type: 'actions', id: 'invisible', config: { buttons: INVISIBLE_ACTIONS } },
        { type: 'log', id: 'invisible-log' },
      ]),
      buildSecondaryTab('layout', '布局', [
        { type: 'docs', id: 'layout-docs', config: { content: DOCS.layout, title: '布局配置' } },
        { type: 'code', id: 'layout', config: { defaultCode: CODE_TEMPLATES.layoutConfig } },
        { type: 'actions', id: 'layout', config: { buttons: LAYOUT_ACTIONS } },
        { type: 'log', id: 'layout-log' },
      ]),
      buildSecondaryTab('walk', '行走', [
        { type: 'docs', id: 'walk-docs', config: { content: DOCS.walk, title: '行走动画' } },
        { type: 'code', id: 'walk', config: { defaultCode: CODE_TEMPLATES.walkDefine } },
        { type: 'actions', id: 'walk', config: { buttons: WALK_ACTIONS } },
        { type: 'log', id: 'walk-log' },
      ]),
      buildSecondaryTab('widget', 'Widget', [
        { type: 'docs', id: 'widget-docs', config: { content: DOCS.widget, title: 'Widget 自定义渲染' } },
        { type: 'code', id: 'widget', config: { defaultCode: CODE_TEMPLATES.widgetCustomEvent } },
        { type: 'actions', id: 'widget', config: { buttons: WIDGET_ACTIONS } },
        { type: 'log', id: 'widget-log' },
      ]),
      buildSecondaryTab('state-switch', '状态切换', [
        { type: 'docs', id: 'state-switch-docs', config: { content: DOCS.stateSwitch, title: '状态切换' } },
        { type: 'code', id: 'state-switch', config: { defaultCode: CODE_TEMPLATES.stateInterrupt } },
        { type: 'actions', id: 'state-switch', config: { buttons: STATE_SWITCH_ACTIONS } },
        { type: 'log', id: 'state-switch-log' },
      ]),
    ],
  },
  // ===== 感知&大脑 =====
  {
    id: 'agent',
    label: '感知&大脑',
    requiresConnection: true,
    secondaryTabs: [
      buildSecondaryTab('agent-init', '初始化', [
        { type: 'docs', id: 'agent-init-docs', config: { content: DOCS.agentInit, title: '初始化' } },
        { type: 'code', id: 'agent-init', config: { defaultCode: CODE_TEMPLATES.agentCallbacks } },
        { type: 'actions', id: 'agent-init', config: { buttons: AGENT_INIT_ACTIONS } },
        { type: 'log', id: 'agent-init-log' },
      ]),
      buildSecondaryTab('agent-text', '文本对话', [
        { type: 'docs', id: 'agent-text-docs', config: { content: DOCS.agentText, title: '文本对话' } },
        { type: 'code', id: 'agent-text', config: { defaultCode: CODE_TEMPLATES.agentTextChat } },
        { type: 'actions', id: 'agent-text', config: { buttons: AGENT_TEXT_ACTIONS } },
        { type: 'log', id: 'agent-text-log' },
      ], true),
      buildSecondaryTab('agent-voice', '语音对话', [
        { type: 'docs', id: 'agent-voice-docs', config: { content: DOCS.agentVoice, title: '语音对话' } },
        { type: 'code', id: 'agent-voice', config: { defaultCode: CODE_TEMPLATES.agentVoiceStart } },
        { type: 'actions', id: 'agent-voice', config: { buttons: AGENT_VOICE_ACTIONS } },
        { type: 'log', id: 'agent-voice-log' },
      ], true),
    ],
  },
  // ===== 智能体 Demo =====
  {
    id: 'agent-demo',
    label: '智能体Demo',
    requiresConnection: false,
    requiresConfig: true, // 依赖「初始化」保存的 AppId / AppSecret，未配置时置灰
    secondaryTabs: [
      buildSecondaryTab('demo', 'Demo', [
        { type: 'code', id: 'demo', config: { defaultCode: CODE_TEMPLATES.demoHtml } },
        { type: 'actions', id: 'demo', config: { buttons: DEMO_ACTIONS } },
        { type: 'log', id: 'demo-log' },
      ]),
    ],
  },
  // ===== 帮助（隐藏 Tab，由侧边栏帮助按钮打开）=====
  {
    id: 'help',
    label: '帮助',
    requiresConnection: false,
    hidden: true,
    secondaryTabs: [
      buildSecondaryTab('usage', '使用说明', [
        { type: 'docs', id: 'usage-docs', config: { content: DOCS.usage, title: '使用说明' } },
      ]),
    ],
  },
];