// ============================================
// Tab Registry — All tab definitions
// ============================================

import type { PrimaryTab, SecondaryTab } from '../types';
import {
  CREATE_INSTANCE_ACTIONS,
  CONNECT_RENDER_ACTIONS,
  SPEAK_ACTIONS,
  SSML_ACTIONS,
  KA_ACTIONS_DEF,
  EMOTION_ACTIONS,
  INVISIBLE_ACTIONS,
  STATE_SWITCH_ACTIONS,
  WALK_ACTIONS,
  LAYOUT_ACTIONS,
  WIDGET_ACTIONS,
  AGENT_TEXT_ACTIONS,
  AGENT_VOICE_ACTIONS,
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
  prerequisite: `## 前置准备

在接入星云具身驱动 SDK 之前，你需要完成以下准备工作。

### 1. 注册与获取凭证

1. 访问 [魔法星云平台](https://xingyun3d.com/) 注册账号${INVITE_SUFFIX}
2. 创建一个**驱动应用**，选择角色、音色、表演风格
3. 获取 **App ID** 和 **App Secret** —— 这两个值是 SDK 初始化的必填凭证，用于身份识别和请求签名

### 2. 环境要求

| 要求 | 详情 |
|------|------|
| **浏览器** | Chrome 94+ / Edge 94+ / Safari 15+ / Firefox 100+（推荐 Chrome 以获得最佳性能） |
| **WebGL** | 需要 WebGL 2.0 支持 |
| **网络** | 需要稳定的 WebSocket 连接 |
| **容器** | 需要一个 DOM 容器元素用于挂载 Canvas |
| **芯片** | x86 架构芯片；ARM 架构芯片：RK3588 建议清晰度 1080P，RK3566 建议清晰度 720P |

### 3. SDK 加载

SDK 通过 CDN script 标签加载，暴露 \`window.XmovAvatar\` 全局变量：

\`\`\`html
<script src="https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar@latest.js"><\/script>
\`\`\`

### 4. 核心能力概览

- **实时 3D 数字人渲染**：基于 WebGL 的 GPU 加速渲染，支持面部表情、口型、骨骼动画的实时驱动
- **SSML 语音合成**：支持通过 SSML 标签驱动播报、停顿、注音、动作，口型与语音精准同步
- **多状态行为控制**：提供 Idle、Interactive Idle、Listen、Think、Speak 等多种行为状态
- **Widget 组件**：支持在数字人画面上叠加展示图片、字幕、视频等自定义 UI 组件
- **事件回调**：提供丰富的回调接口，覆盖状态变化、语音播放、网络质量、错误处理等环节
`,

  createInstance: `## 创建数字人实例

使用 \`new XmovAvatar(options)\` 创建实例。构造函数接受一个 \`options\` 配置对象。

### 必填参数

| 参数 | 类型 | 说明 |
|------|------|------|
| \`appId\` | \`string\` | 应用 ID，由平台分配，用于身份识别 |
| \`appSecret\` | \`string\` | 应用密钥，由平台分配，用于请求签名 |
| \`gatewayServer\` | \`string\` | 网关服务地址。固定值：\`https://nebula-agent.xingyun3d.com/user/v1/ttsa/session\` |
| \`onMessage\` | \`(error: SDKError) => void\` | 错误/事件回调，**必须实现** |

### 容器配置

| 参数 | 类型 | 说明 |
|------|------|------|
| \`containerId\` | \`string\` | CSS 选择器，如 \`#avatar-container\` |
| \`container\` | \`HTMLElement\` | DOM 元素引用（优先级更高） |

> 两个参数至少填写一个。若都填写，优先取 \`container\`。

### 可选参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| \`config\` | \`object\` | \`undefined\` | 运行时配置（布局、行走、背景等），详见布局 Tab |
| \`enableClientInterrupt\` | \`boolean\` | \`false\` | 是否启用客户端打断功能 |

### 回调参数

| 回调 | 类型 | 说明 |
|------|------|------|
| \`onStatusChange\` | \`(status: AvatarStatus) => void\` | 数字人状态变化（online/offline/close/invisible） |
| \`onRenderChange\` | \`(state: RenderState) => void\` | 渲染状态变化（init/rendering/paused/stopped） |
| \`onVoiceStateChange\` | \`(state: string, duration?: number) => void\` | 语音播放状态（start/end） |
| \`onSpeakStateChange\` | \`(state: string, speakId: string) => void\` | 说话状态（speak_start/speak_end/speak_error） |
| \`onWalkStateChange\` | \`(state: string) => void\` | 行走状态（walk_start/walk_end） |
| \`onWidgetEvent\` | \`(data: IRawWidgetData) => void\` | UI 组件事件回调 |
| \`proxyWidget\` | \`{ [key: string]: (data: any) => void }\` | 按组件类型注册自定义渲染函数 |
| \`onNetworkInfo\` | \`(info: INetworkInfo) => void\` | 网络质量回调（RTT、下行速率） |
| \`onStartSessionWarning\` | \`(message: object) => void\` | 会话配置警告 |
`,

  connectRender: `## 连接与渲染

### init() — 初始化

加载资源包、建立 WebSocket 连接、初始化渲染器。

\`\`\`javascript
await avatar.init({
  onDownloadProgress(progress) {
    console.log('加载进度:', progress + '%');
  },
});
\`\`\`

| 参数 | 类型 | 说明 |
|------|------|------|
| \`params.onDownloadProgress\` | \`(progress: number) => void\` | **必填**，资源加载进度回调（0-100） |
| \`params.initModel\` | \`InitModel\` | 可选，设为 \`invisible\` 可在启动时进入隐身模式 |

**返回** \`Promise<void>\`，初始化完成后 resolve，失败时 reject。

### destroy() — 完整销毁

销毁 SDK 实例，释放所有资源，并通知服务端结束会话。

\`\`\`javascript
await avatar.destroy('reason');
\`\`\`

### 状态控制方法

| 方法 | 说明 |
|------|------|
| \`idle()\` | 切换到空闲状态，停止当前动作 |
| \`interactiveidle()\` | 切换到交互空闲状态，表示可交互等待 |
| \`listen()\` | 切换到聆听状态 |
| \`getStatus()\` | 获取当前数字人状态 |
| \`getRenderState()\` | 获取当前渲染状态 |

### 网络与会话控制

| 方法 | 说明 |
|------|------|
| \`offlineMode()\` | 手动进入离线模式 |
| \`onlineMode()\` | 手动进入在线模式，触发重连 |
| \`reStartSession()\` | 手动触发会话重启/重连 |
| \`getSessionId()\` | 获取当前会话 ID |

### 断线重连

SDK 自动处理断线重连（最多 27 次）。断线时播放预缓存的 Idle 动画，重连成功后自动恢复状态。

\`\`\`
visible → (断线) → offline → (重连成功) → visible
                        ↓ (重连失败)
                      close
\`\`\`
`,

  speak: `## 播报

使用 \`avatar.speak(ssml, is_start?, is_end?, extra?)\` 驱动数字人说话播报。

### 基本用法

\`\`\`javascript
avatar.speak('<speak>你好！</speak>');
\`\`\`

### 流式播报

分段发送长文本，使用 \`is_start\` 和 \`is_end\` 标记边界，适用于实时对话和长文本场景：

\`\`\`javascript
// 第一段（开始）
avatar.speak('<speak>这是第一句话。</speak>', true, false);
// 中间段
avatar.speak('<speak>这是第二句话。</speak>', false, false);
// 最后一段（结束）
avatar.speak('<speak>这是最后一句话。</speak>', false, true);
\`\`\`

### 带情绪播报

通过 \`extra.emotion\` 参数指定情绪，影响音色和面部表情：

\`\`\`javascript
avatar.speak('<speak>太棒了！</speak>', true, true, { emotion: 'happy' });
\`\`\`

### 打断（interrupt）

需要在创建实例时设置 \`enableClientInterrupt: true\`：

\`\`\`javascript
const latency = avatar.interrupt('user'); // 返回打断耗时（毫秒）
\`\`\`

### speak() 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| \`ssml\` | \`string\` | 是 | SSML 格式的文本 |
| \`is_start\` | \`boolean\` | 否 | 是否为本次说话的第一段（默认 true） |
| \`is_end\` | \`boolean\` | 否 | 是否为本次说话的最后一段（默认 true） |
| \`extra\` | \`object\` | 否 | 额外参数，如 \`{ emotion: 'happy' }\` |

### 语音状态回调

通过构造参数中的 \`onVoiceStateChange\` 和 \`onSpeakStateChange\` 可监听语音和说话状态：

\`\`\`javascript
onVoiceStateChange(state, duration) {
  // state: 'start' | 'end', duration: 毫秒数（仅 start 时）
},
onSpeakStateChange(state, speakId) {
  // state: 'speak_start' | 'speak_end' | 'speak_error'
},
\`\`\`
`,

  stateSwitch: `## 状态切换

数字人支持多种行为状态，通过以下方法切换（调用后会同步通知服务端）。

### 状态一览

| 方法 | 状态 | 说明 |
|------|------|------|
| \`idle()\` | 空闲 Idle | 停止当前动作，进入静默待机动画 |
| \`interactiveidle()\` | 交互空闲 Interactive Idle | 表示数字人处于可交互的等待状态 |
| \`listen()\` | 聆听 Listen | 表示数字人正在聆听用户输入 |
| \`speak(...)\` | 说话 Speak | 播报（详见「播报」Tab） |

### 典型流程

\`\`\`javascript
// 用户开始输入
avatar.listen();

// AI 回复到达，开始说话
avatar.speak('<speak>这是回复内容</speak>');

// 说话结束，回到交互空闲（实践中由 onSpeakStateChange 的 'end' 事件触发）
avatar.interactiveidle();
\`\`\`

### 语音打断

打断数字人当前说话，返回打断耗时（毫秒）。**需要创建实例时设置 \`enableClientInterrupt: true\`**（见「创建实例」的完整配置模板）。

\`\`\`javascript
// 先播放一段长语音，停留 2 秒后打断
avatar.speak('<speak>这是一段较长的语音，用来演示打断效果。</speak>');
await wait(2);
const latency = avatar.interrupt('user');
log('打断耗时:', latency, 'ms');
\`\`\`

\`type\` 参数为打断来源标签（\`'user'\` / \`'user_speaking'\` / \`'speak'\` 等）。除 \`'in_offline_mode'\` 外，所有 type 行为完全相同，仅用于日志区分。

### 获取当前状态

\`\`\`javascript
const status = avatar.getStatus();               // AvatarStatus：0=在线, 1=离线, 4=关闭, 5=可见, 6=隐身
const renderState = avatar.getRenderState();     // RenderState：init / rendering / paused / stopped
log('状态:', status, '渲染:', renderState);
\`\`\`
`,

  ssml: `## SSML 基础

SSML（语音合成标记语言）驱动数字人的**播报、停顿、注音、动作、行走、控件**。SDK 参考了 Azure SSML 标准并做了简化适配。

> 一句话理解：在 \`speak()\` 里传入的每一段文字，都可以混合嵌入指令标签，数字人会按顺序边说边做动作、展示控件、移动位置。

### 根标签 \`<speak>\`

所有 SSML 内容必须包裹在 \`<speak>\` 标签中：

\`\`\`xml
<speak>
  ... 内容和指令 ...
</speak>
\`\`\`

### 子标签一览

| 标签 | 用途 | 类别 |
|------|------|------|
| \`<break>\` | 停顿 | 基础 |
| \`<phoneme>\` | 注音（多音字纠正） | 基础 |
| 纯文本 | 汉字/英文，正常播报 | 基础 |
| \`<ue4event>\` | 关键动作（ka/ka_intent）、行走（walk） | 动作 |
| \`<uievent>\` | 自定义控件事件（图片/视频/链接/文本卡片/背景音乐） | 控件 |

### 1. 停顿 \`<break>\`

在句子之间插入停顿：

\`\`\`xml
<speak>
  第一句话。
  <break time="500ms"/>
  停半秒后第二句话。
</speak>
\`\`\`

### 2. 注音 \`<phoneme>\`

给多音字/生僻字标注正确读音：

\`\`\`xml
<speak>
  这项<phoneme py="mei3 di4">美的</phoneme>技术正在改变世界。
</speak>
\`\`\`

> \`py\` 属性格式：拼音 + 声调数字，多字用空格分隔。生僻字和特殊字符建议预处理过滤。

### 3. 自定义控件 \`<uievent>\`

说话时弹出图片、视频、链接等控件（详见 Widget Tab）：

\`\`\`xml
<speak>
  请看大屏幕。
  <uievent>
    <type>show_image</type>
    <data><image>https://example.com/poster.png</image><title>新品发布</title></data>
  </uievent>
</speak>
\`\`\`

### 4. 关键动作与行走

通过 \`<ue4event>\` 嵌入，详见"KA"和"行走" Tab。

### 组合示例

\`\`\`xml
<speak>
  大家好，欢迎来到产品发布会。
  <ue4event><type>ka</type><data><action_semantic>Elevate</action_semantic></data></ue4event>
  首先介绍今天的主题。
  <break time="500ms"/>
  各位请看大屏幕。
  <uievent><type>show_image</type><data><image>https://example.com/slide.png</image><title>产品路线图</title></data></uievent>
  <phoneme py="gan4 xie4">感谢</phoneme>大家的聆听！
</speak>
\`\`\`
`,

  ka: `## 关键动作 (KA)

KA = Key Action，数字人的预设肢体动作。通过 SSML 中的 \`<ue4event>\` 标签嵌入，数字人会在播报**对应文本的同时**做出动作。

> 关键动作不是客户端 API，而是通过 SSML 标签下发给**服务端**处理。服务端在合成语音的同时驱动数字人做出肢体动作。

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

隐身模式用于在不需要数字人画面时暂停渲染、节省 CPU/GPU 资源。

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

### 隐身初始化

启动时即进入隐身模式，延迟到需要时再恢复：

\`\`\`javascript
await avatar.init({ initModel: 'invisible' });  // 无渲染启动
// 需要时恢复
avatar.switchInvisibleMode();
\`\`\`

### 使用场景

| 场景 | 推荐 API |
|------|----------|
| 用户最小化窗口/切到后台 | \`switchInvisibleMode()\` — 节省资源 |
| 仅需隐藏画面、保留音频 | \`changeAvatarVisible(false)\` |
| 首次加载不需要展示数字人 | \`init({ initModel: 'invisible' })\` |
`,

  walk: `## 行走动画

行走动画允许数字人在水平方向上移动位置，适用于虚拟展厅、引导讲解等场景。

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
  if (state === 'walk_start') console.log('数字人开始行走');
  if (state === 'walk_end') console.log('数字人到达目的地');
}
\`\`\`

> ⚠️ 必须先调用 \`changeWalkConfig()\` 配置好点位，再发行走 SSML。\`target\` 必须在 \`walk_points\` 中存在。
`,

  layout: `## 布局配置

Layout 配置控制数字人在容器中的位置和大小。

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
const avatar = new XmovAvatar({
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

Widget 机制允许在数字人播报过程中渲染图片、视频、链接等多媒体元素。

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
    case 'widget_pic':   showPicture(data.url); break;
  }
}
\`\`\`

### proxyWidget 示例

\`\`\`javascript
proxyWidget: {
  subtitle_on(data)  { updateSubtitle(data.text); },
  subtitle_off(data) { hideSubtitle(); },
  widget_pic(data)   { showPicture(data.url); },
  custom_card(data)  { renderCustomCard(data); },
}
\`\`\`

> 注册后该类型的事件**不会**走 SDK 内置渲染器。未注册类型的事件仍走 \`onWidgetEvent\`。

### SDK 内置事件

| 事件 type | 说明 | 数据字段 |
|-----------|------|----------|
| \`subtitle_on\` | 显示字幕 | \`data.text\` |
| \`subtitle_off\` | 隐藏字幕 | — |
| \`widget_pic\` | 显示图片 | \`data.url\` |

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

  agentArchitecture: `## 具身智能体（Embodied Agent）

具身智能体 = **感知** → **大脑** → **表达**

\`\`\`
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    感 知      │     │    大 脑      │     │    表 达      │
│              │     │              │     │              │
│ 麦克风/输入    │ ──► │ 大模型推理决策  │ ──► │ 数字人呈现     │
│ 腾讯云 ASR    │     │ 豆包 Doubao    │     │ XmovAvatar    │
└──────────────┘     └──────────────┘     └──────────────┘
\`\`\`

### 感知

获取外部信息，转换成机器可处理的信号。在本 demo 中包括：

- **键盘文本输入**：最直接的感知方式
- **麦克风录音 → 语音识别**：通过浏览器 \`getUserMedia\` 获取音频，流式语音识别（ASR）转为文本

### 大脑

利用大语言模型（LLM）对感知信息进行理解、推理和决策。

- 本 demo 使用**豆包大模型**（通过火山方舟 ARK 接入，OpenAI 兼容）
- 设定 system prompt 让模型以数字人身份回答
- 让模型输出友好的回复文本

### 表达

将大脑的决策结果呈现给用户。在本 demo 中即 **数字人播报**。

- \`avatar.speak(reply)\` 驱动数字人说话
- 可以配合情绪（emotion）、关键动作（KA）让表达更生动

### 三条链路

| # | 链路 | 感知 | 大脑 | 表达 |
|---|------|------|------|------|
| 1 | **文本对话** | \`prompt()\` 输入 | Doubao-Seed | avatar.speak() |
| 2 | **语音对话** | 麦克风 → ASR → 文本 | Doubao-Seed | avatar.speak() |

接下来从「环境准备」开始，一步步跑通这些链路。
`,

  agentPrepare: `## 环境准备

在开始调用大模型和语音识别之前，需要准备好以下凭证。

### 1. 注册火山引擎账号

访问 [火山引擎](https://www.volcengine.com/) 注册并完成实名认证。

### 2. 获取火山方舟 ARK API Key（用于文本对话）

1. 进入 [火山方舟控制台](https://console.volcengine.com/ark)
2. 在「API Key 管理」页面创建 API Key，复制保存
3. 在「模型广场」找到豆包模型（如 \`doubao-seed-2-0-lite-260428\`），点击「开通」并获取接入点（Endpoint）
4. API 地址格式：\`https://ark.cn-beijing.volces.com/api/v3\`

> ⚠️ API Key 等同于密码，请勿提交到代码仓库或公开分享。教学用途建议使用可随时吊销的临时 Key。

### 3. 开通实时语音识别（用于语音对话）

1. 进入 [语音识别控制台](https://console.cloud.tencent.com/asr) 开通服务
2. 在 [访问管理](https://console.cloud.tencent.com/cam/capi) 获取 **SecretId** 与 **SecretKey**（API 密钥）
3. 在账号信息页面获取 **AppId**
4. 不需要代理——腾讯云 ASR 的 HMAC-SHA1 签名走 URL query，浏览器可直接连接 WebSocket

### 4. 填写凭证

**在下方表单中填写以上凭证，点击「保存配置」**：
- 凭证将保存到浏览器本地存储
- 编辑器中的代码始终保持 \`{{...}}\` 占位符，点击「执行」时才自动注入这些值
- 先填 Base URL 和 API Key，然后在模型 ID 输入框填入你选择的模型 ID

然后点击「测试大模型连接」验证配置是否正确。
`,

  agentText: `## 文本对话

实现流程：**用户输入 → 大模型 → 数字人说**

### Chat API（火山方舟 ARK，OpenAI 兼容）

火山方舟 ARK 完全兼容 OpenAI 格式：

\`\`\`
POST {baseUrl}/chat/completions
Authorization: Bearer <API_KEY>
Content-Type: application/json
\`\`\`

请求体结构：

\`\`\`json
{
  "model": "doubao-seed-2-0-mini-260428",
  "messages": [
    { "role": "system", "content": "你是数字人助手，请简短友好地回答。" },
    { "role": "user", "content": "今天天气怎么样？" }
  ]
}
\`\`\`

> 可在「环境准备」tab 的 Base URL 对应的模型广场查看可用模型 ID。

### 实现要点

1. 用 \`prompt()\` 获取用户输入文本
2. \`fetch\` 调用 ARK Chat API，解析返回的 \`choices[0].message.content\`
3. \`avatar.speak(reply)\` 让数字人说

> API Key 在 [火山方舟控制台](https://console.volcengine.com/ark) 创建。

### 代码模板

右侧代码编辑器已经为你准备了一段完整的实现。点击「执行」按钮运行即可体验。
`,

  agentVoice: `## 语音对话

实现流程：**麦克风录音 → ASR（腾讯云 SDK）→ 大模型 → 数字人说**

### 使用腾讯云语音识别 SDK

本 demo 使用官方 **[tencentcloud-speech-sdk-js](https://github.com/TencentCloud/tencentcloud-speech-sdk-js)**（CDN 加载），在浏览器中直接完成录音 + WebSocket 连接 + 识别：

1. SDK 通过 \`Real-time Speech Recognition (WebSocket)\` 服务直连腾讯云
2. 鉴权使用 **HMAC-SHA1 签名**，放在 URL query 中（不是 HTTP header），因此浏览器可以直接连接，不需要代理
3. SDK 内部处理录音（\`getUserMedia\`）、音频分包、签名生成、WebSocket 帧的收发

> 腾讯云 ASR 使用 HMAC-SHA1 签名放在 URL query 中，浏览器可直接连接 WebSocket，不需要代理。

### 识别参数

- **引擎模型**：\`16k_zh\`（中文通用，推荐）/ \`16k_zh_en\`（中英大模型）/ \`8k_zh\`（电话场景）
- **音频格式**：PCM（\`voice_format: 1\`）

### 录音流程

1. 在「环境准备」tab 填写 ASR SecretId / SecretKey / AppId，保存配置
2. 点「执行」→ SDK 请求麦克风权限并开始录音识别
3. 点页面右上角浮出的「⏹ 结束录音并识别」按钮作为「手动结束」边界
4. SDK 返回识别文本 → 交给大模型 → 数字人播报
`,

  usage: `## 使用说明

本教学系统用于动手体验「魔法星云」具身智能 SDK：在左侧边栏选择功能模块，在代码编辑框修改代码，点击「执行」按钮运行，结果与日志显示在下方日志面板。

### 基本流程

1. **选择 Tab**：左侧边栏按「初始化 → 交互功能 → 智能体」的顺序学习
2. **查看说明**：每个 Tab 顶部的文档介绍该能力的用法
3. **编辑代码**：编辑框已预置示例代码，可直接修改
4. **执行**：点击「执行」按钮运行，日志输出到下方面板
5. **观察**：数字人实时响应，日志面板展示状态变化与回调

> ⚠️ 「交互功能」「智能体」需要先创建实例并连接成功才能使用（侧边栏对应 Tab 会提示"需先创建连接"）。

### 代码编辑框特定用法

#### 1. \\{\\{变量\\}\\} 占位符

代码中的 \`{{变量名}}\` 会在点击「执行」时**自动替换**为你在表单里保存的凭证：

| 占位符 | 来源 |
|--------|------|
| \`{{appId}}\` / \`{{appSecret}}\` | 创建实例表单 |
| \`{{baseUrl}}\` / \`{{apiKey}}\` / \`{{modelId}}\` | 环境准备 · 大模型 |
| \`{{asrSecretId}}\` / \`{{asrSecretKey}}\` / \`{{asrAppId}}\` / \`{{asrEngineModel}}\` | 环境准备 · 语音识别 |

未配置的占位符**保持原样**（如 \`{{appId}}\`），预置模板会检测到并用 \`log()\` 提示你先去配置。

#### 2. async 执行

代码运行在 **async 上下文**中，可以直接 \`await\` 异步方法，无需手动包裹 \`async\` 函数：

\`\`\`javascript
await avatar.init({ onDownloadProgress: (p) => log('加载进度:', p + '%') });
await wait(1);
await avatar.speak('<speak>你好！</speak>');
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
  modules: SecondaryTab['modules']
): SecondaryTab {
  return { id, label, modules };
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
  // ===== 交互功能 =====
  {
    id: 'interaction',
    label: '交互功能',
    requiresConnection: true,
    secondaryTabs: [
      buildSecondaryTab('speak', '播报', [
        { type: 'docs', id: 'speak-docs', config: { content: DOCS.speak, title: '播报' } },
        { type: 'code', id: 'speak', config: { defaultCode: CODE_TEMPLATES.speakNormal } },
        { type: 'actions', id: 'speak', config: { buttons: SPEAK_ACTIONS } },
        { type: 'log', id: 'speak-log' },
      ]),
      buildSecondaryTab('ssml', 'SSML', [
        { type: 'docs', id: 'ssml-docs', config: { content: DOCS.ssml, title: 'SSML 基础' } },
        { type: 'code', id: 'ssml', config: { defaultCode: CODE_TEMPLATES.ssmlBreak } },
        { type: 'actions', id: 'ssml', config: { buttons: SSML_ACTIONS } },
        { type: 'log', id: 'ssml-log' },
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
  // ===== 智能体 =====
  {
    id: 'agent',
    label: '智能体',
    requiresConnection: true,
    secondaryTabs: [
      buildSecondaryTab('agent-architecture', '智能体构成', [
        { type: 'docs', id: 'agent-architecture-docs', config: { content: DOCS.agentArchitecture, title: '智能体构成' } },
      ]),
      buildSecondaryTab('agent-prepare', '环境准备', [
        { type: 'docs', id: 'agent-prepare-docs', config: { content: DOCS.agentPrepare, title: '环境准备' } },
        { type: 'config', id: 'agent-config-form' },
        { type: 'log', id: 'agent-prepare-log' },
      ]),
      buildSecondaryTab('agent-text', '文本对话', [
        { type: 'docs', id: 'agent-text-docs', config: { content: DOCS.agentText, title: '文本对话' } },
        { type: 'code', id: 'agent-text', config: { defaultCode: CODE_TEMPLATES.agentTextChat } },
        { type: 'actions', id: 'agent-text', config: { buttons: AGENT_TEXT_ACTIONS } },
        { type: 'log', id: 'agent-text-log' },
      ]),
      buildSecondaryTab('agent-voice', '语音对话', [
        { type: 'docs', id: 'agent-voice-docs', config: { content: DOCS.agentVoice, title: '语音对话' } },
        { type: 'code', id: 'agent-voice', config: { defaultCode: CODE_TEMPLATES.agentVoiceChat } },
        { type: 'actions', id: 'agent-voice', config: { buttons: AGENT_VOICE_ACTIONS } },
        { type: 'log', id: 'agent-voice-log' },
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
