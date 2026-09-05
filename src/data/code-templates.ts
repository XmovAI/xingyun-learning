// ============================================
// Code Templates — Default code per tab (E2E SDK: XingyunAvatarAgent)
// ============================================

export const CODE_TEMPLATES = {
  // --- 初始化 ---
  createInstance: `// 创建端到端智能体（Agent）实例 —— 最简配置
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
});`,

  createInstanceFull: `// 创建端到端智能体（Agent）实例 —— 完整配置
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
});`,

  init: `// 初始化连接
await avatar.init({
  onDownloadProgress(progress) {
    log('加载进度:', progress + '%');
    if (progress === 100) {
      log('加载成功');
    }
  },
});
log('初始化完成，Agent 状态:', avatar.getAgentState());`,

  destroy: `// 销毁实例（释放连接与麦克风资源）
await avatar.destroy('user_action');`,

  // --- 播报 ---
  speakNormal: `// 纯文本播报
avatar.speak('你好，我是你的魔珐星云助手！');
log('已发起播报，观察代理日志中的对话状态变化');`,

  speakSSML: `// SSML 播报 —— 停顿与注音示例
// 停顿：用 <break> 控制播报语气与节奏
avatar.speak(\`
<speak>
  第一句话说完。
  <break time="1s"/>
  停顿一秒后继续。
  <break time="500ms"/>
  再停半秒。
</speak>
\`, true, false);

// 注音：用 <phoneme> 指定多音字读音
avatar.speak(\`
<speak>
  这项<phoneme py="mei3 di4">美的</phoneme>技术正在改变世界。
  <phoneme py="hang2 ye2">行业</phoneme>领先。
</speak>
\`, false, true);`,

  speakStream: `// 流式播报
avatar.speak('<speak>这是第一段内容。</speak>', true, false);
await wait(1);
avatar.speak('<speak>这是第二段内容。</speak>', false, false);
await wait(1);
avatar.speak('<speak>这是最后一段内容。</speak>', false, true);`,

  speakExtra: `// 带情绪的播报
avatar.speak('<speak>太棒了！我们成功了！</speak>', true, true, {
  emotion: 'happy',
});`,

  // --- KA ---
  kaAction: (action: string) => `// 关键动作: ${action} —— SSML 指令驱动智能体做手势
avatar.speak(\`
<speak>
  大家好！
  <ue4event>
    <type>ka</type>
    <data>
      <action_semantic>${action}</action_semantic>
    </data>
  </ue4event>
  感谢大家的关注。
</speak>
\`);`,

  kaIntent: (intent: string) => `// 动作意图: ${intent} —— SSML 指令表达动作意图
avatar.speak(\`
<speak>
  请看这里。
  <ue4event>
    <type>ka_intent</type>
    <data>
      <ka_intent>${intent}</ka_intent>
    </data>
  </ue4event>
  我来为大家演示。
</speak>
\`);`,

  // --- 情绪 ---
  emotion: (emotion: string) => {
    const texts: Record<string, string> = {
      happy: '今天心情真好，感觉特别棒！',
      sad: '今天心情有点低落……',
      angry: '这让我非常生气！',
      surprised: '哇，这真的太让人惊讶了！',
      neutral: '今天天气不错，一切照常。',
    };
    const text = texts[emotion] || '今天心情不错。';
    return `// 情绪: ${emotion} —— speak() 的 extra.emotion 控制表情与音色
avatar.speak('<speak>${text}</speak>', true, true, {
  emotion: '${emotion}',
});`;
  },

  // --- 隐身模式 ---
  invisibleToggle: `// 切换隐身模式（开关式 API：停止渲染并通知后端暂停推送）
// 可见时调用 → 停止渲染 + 后端暂停推送
// 再次调用 → 恢复渲染 + 后端恢复推送
avatar.switchInvisibleMode();`,

  invisibleVisible: `// 纯 UI 隐藏/显示智能体（不影响渲染和后端推送）
avatar.changeAvatarVisible(false);   // 隐藏 Canvas
// avatar.changeAvatarVisible(true); // 重新显示`,

  // --- 状态切换 ---
  stateIdle: `// 空闲状态 — 智能体停止当前动作，进入静默待机动画
avatar.idle();`,

  stateInteractiveIdle: `// 交互空闲 — 表示智能体处于可交互的等待状态
avatar.interactiveidle();`,

  stateListen: `// 聆听状态 — 表示智能体正在聆听用户输入
avatar.listen();`,

  stateInterrupt: `// 调用 interrupt() 打断当前播报（enableClientInterrupt 默认开启），返回打断耗时（ms）
// interrupt() 不会自动关闭 ASR / 麦克风；要结束监听请另调 stopASR()
avatar.speak('<speak>这是一段较长的语音，用来演示打断效果。智能体将持续播报这段话，请在播放过程中观察打断。</speak>');
await wait(2);
const latency = avatar.interrupt('user');
log('打断耗时:', latency, 'ms');
await wait(1);
avatar.speak('<speak>这是一段较长的语音，用来演示打断效果。智能体将持续播报这段话，请在播放过程中观察打断。</speak>');
await wait(2);
avatar.speak('<speak>开始第二段话。</speak>');`,

  // --- 行走 ---
  walkDefine: `// 定义行走点位（供 SSML walk 标签引用）
avatar.changeWalkConfig({
  walk_points: {
    A: 0, B: 200, C: 400, D: 600, E: 800
  },
  init_point: 400,
});
log('点位定义完成');`,

  walkGo: `// 触发行走 — SSML walk 指令让智能体移动到目标点位
avatar.speak(\`
<speak>
  <ue4event>
    <type>walk</type>
    <data>
      <target>B</target>
    </data>
  </ue4event>
  我正在走过去。
</speak>
\`);`,

  // --- 布局 ---
  layoutConfig: `// 修改布局配置（动态取容器实际宽高）
const container = document.getElementById('avatar-container');
const width = container.clientWidth;
const height = container.clientHeight;
log('容器尺寸:', width + 'x' + height);
avatar.changeLayout({
  container: { size: [width, height] },
  avatar: {
    v_align: 'center',
    h_align: 'center',
    scale: 0.8,
    offset_x: 0,
    offset_y: 0,
  },
});
log('布局已更新');`,

  // --- Widget ---
  widgetCustomEvent: `// 自定义事件：图片 + 视频 —— 播报中驱动显示多媒体
avatar.speak(\`
<speak>
  <uievent>
    <type>show_image</type>
    <data>
      <image>https://example.com/1.png</image>
      <title>图片1</title>
    </data>
  </uievent>
  首先展示图片。
  <uievent>
    <type>show_video</type>
    <data>
      <video>https://example.com/demo.mp4</video>
      <cover>https://example.com/c.jpg</cover>
      <title>视频</title>
    </data>
  </uievent>
  接着播放视频。
</speak>
\`);`,

  // 注入到创建实例代码 options 中的回调片段（缩进 2 空格，与 options 层级对齐）
  widgetOnEventOption: `  onWidgetEvent(data) {
    log('Widget 事件:', data.type, data);
  },`,

  widgetProxyOption: `  proxyWidget: {
    subtitle_on(data) {
      log('Widget 字幕:', data.type, data);
    },
    show_image(data) {
      log('Widget 图片:', data.type, data);
    },
    show_video(data) {
      log('Widget 视频:', data.type, data);
    },
  },`,

  // --- 感知&大脑: 初始化（回调函数 / 自定义配置 / 重新加载）---
  // 「回调函数」按钮：填充 ASR / LLM 相关回调，合并进创建实例代码的 agentCallbacks
  agentCallbacks: `// ASR / LLM 相关回调 —— 点击「重新加载」时合并进「创建实例」代码
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
});`,

  // 「ASR独立调用」按钮：关闭「识别结果自动发大脑」，由业务在 onASRResult 里
  // 识别「你好」指令前缀后手动触发 ask() —— 识别与对话完全解耦
  agentASRIndependent: `// ASR 独立调用 —— 关闭「识别结果自动发大脑」，由业务手动判定
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
});`,

  // 「自定义配置」按钮：填充 asr_config / brain_config 示例（仅测试 / 私有化部署）
  agentCustomConfig: `// ⚠️ 安全提示：asr_config / brain_config 中包含访问凭证（api_key / secret_key），
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
});`,

  // 「重新加载」按钮：创建实例后补上的 init 连接段
  reloadInit: `// 重新加载：实例已创建，执行 init 完成连接
await avatar.init({
  onDownloadProgress(progress) {
    log('加载进度:', progress + '%');
    if (progress === 100) {
      log('加载成功');
    }
  },
});
log('初始化完成，Agent 状态:', avatar.getAgentState());`,

  // --- 感知&大脑: 文本对话 ---
  agentTextChat: `// =============================================
// 端到端文本对话：用户输入 → Brain → 实时播报
// =============================================

if (avatar.getAgentState() !== 'running') {
  log('warn', 'Agent 未就绪（当前状态: ' + avatar.getAgentState() + '）');
  return;
}

// 1. 获取用户输入
const userInput = prompt('请输入你想对具身智能说的话：');
if (!userInput) {
  log('warn', '已取消输入');
  return;
}
log('log', '用户：', userInput);

// 2. 发起 Brain 对话（感知 → 认知 → 表达 全链路由 SDK 完成）
await avatar.ask(userInput);
log('info', '对话已发起，播报结果通过代理日志中的回调观察');
`,

  // --- 感知&大脑: 语音对话 ---
  agentVoiceStart: `// 开始录音：申请麦克风权限并开启流式识别
await avatar.startASR();
log('正在聆听，请说话…（识别结果实时打印在 onASRResult 回调中）');`,

  agentVoiceStop: `// 停止录音：结束本轮识别，最终结果通过 onASRResult（isFinal=true）返回
await avatar.stopASR();
log('已停止录音，最终识别文本见 onASRResult 日志');`,

  // --- 智能体 Demo: 完整独立的 HTML 页面示例 ---
  // 预览时 {{appId}} / {{appSecret}} / {{gatewayServer}} 会被替换成「初始化」tab 保存的值。
  // 注意：本模板内不使用反引号/模板字符串，避免与外层导出字符串冲突。
  demoHtml: `<!DOCTYPE html>
<!--
  智能体 Demo —— 魔珐星云 端到端 SDK（XingyunAvatarAgent）
  独立运行：保存为 .html 在浏览器直接打开，或由教学页「智能体Demo」的「预览」嵌入。
  {{...}} 占位符在「预览」时自动替换为教学页「初始化」tab 保存的凭证；
  独立运行时请手动把下方 {{appId}} / {{appSecret}} 换成你的凭证。
-->
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>智能体 Demo</title>
<style>
  /* ---------- 基础布局：主体为具身智能渲染画布 ---------- */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
    background: radial-gradient(900px 560px at 50% 22%, #1b2b4a 0%, #0b1220 62%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: #e2e8f0;
  }
  #stage {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* 画布比例由容器 div 上的内联 --rw/--rh 决定（16:9 横屏 / 9:16 竖屏），
     data-ratio 仅作教学标记，二者与下方 div 保持一致 */
  #avatar-container {
    position: relative;
    isolation: isolate; /* 把 SDK 画布（z-index:100）限制在容器内部，避免盖住顶部浮层/角标 */
    width: min(100%, calc(100vh * var(--rw) / var(--rh)));
    width: min(100%, calc(100dvh * var(--rw) / var(--rh)));
    aspect-ratio: var(--rw) / var(--rh);
  }

  /* ---------- 顶部状态角标（右上角，避开宿主页左上角的状态） ---------- */
  #status {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 200; /* 高于 SDK 画布（z-index:100） */
    padding: 6px 12px;
    font-size: 13px;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.35);
    color: #cbd5e1;
  }
  #status.online b { color: #34d399; }
  #status.connecting b { color: #fbbf24; }

  /* ---------- 顶部浮层操作栏（图标按钮，无文字） ---------- */
  /* 放在顶部：底部是 SDK 原生字幕区域，浮层在底部会遮住字幕 */
  .controls {
    position: absolute;
    left: 50%;
    top: 20px;
    transform: translateX(-50%);
    z-index: 200; /* 高于 SDK 画布（z-index:100） */
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(6px);
  }
  .controls[hidden] { display: none; }
  /* hidden 属性默认 display:none 会被下面的 display 覆盖，需显式声明 */
  .ctrl-btn[hidden],
  .input-wrap[hidden] { display: none; }
  .ctrl-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 12px;
    background: #1e293b;
    color: #e2e8f0;
    cursor: pointer;
    transition: background .15s, transform .1s;
  }
  .ctrl-btn:hover { background: #334155; }
  .ctrl-btn:active { transform: scale(.95); }
  .ctrl-btn.on { background: #0f766e; }        /* 连接后「销毁」配色 */

  /* 文字输入（会比按钮更宽） */
  .input-wrap { position: relative; width: 210px; }
  #text-input {
    width: 100%;
    height: 44px;
    padding: 0 46px 0 14px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    border-radius: 12px;
    background: #0f172a;
    color: #e2e8f0;
    font-size: 14px;
    outline: none;
  }
  #text-input:focus { border-color: #38bdf8; }
  #btn-send {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    display: none;               /* 输入非空才显示 */
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    border-radius: 9px;
    background: #0ea5e9;
    color: #fff;
    cursor: pointer;
  }
  #btn-send.show { display: inline-flex; align-items: center; justify-content: center; }

  /* 语音录音按钮（与输入框等宽） */
  .ctrl-mic { width: 210px; }
  .ctrl-mic.recording { background: #b91c1c; } /* 录音中红色 */

  /* init 加载进度浮层（盖在画布上，位于操作栏/状态之下、SDK 画布之上） */
  .loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(11, 18, 32, 0.8);
    z-index: 150; /* > SDK canvas 100，< 操作栏/状态 200 */
  }
  .loading[hidden] { display: none; }
  .loading-bar {
    width: 220px;
    height: 6px;
    border-radius: 3px;
    background: rgba(148, 163, 184, 0.3);
    overflow: hidden;
  }
  .loading-bar-fill {
    height: 100%;
    width: 0%;
    border-radius: 3px;
    background: #38bdf8;
    transition: width .2s;
  }
  .loading-text { font-size: 14px; color: #e2e8f0; }

  svg { display: block; }
</style>
</head>
<body>
  <!-- 具身智能渲染画布：data-ratio 与内联 --rw/--rh 控制横竖屏（16:9 横屏 / 9:16 竖屏） -->
  <div id="stage">
    <div id="avatar-container" data-ratio="16/9" style="--rw:16; --rh:9;"></div>
    <!-- init 加载进度浮层 -->
    <div class="loading" id="loading" hidden>
      <div class="loading-bar"><div class="loading-bar-fill" id="loading-fill"></div></div>
      <div class="loading-text" id="loading-text">加载中 0.00%</div>
    </div>
  </div>

  <div id="status">状态：<b id="status-text">未连接</b></div>

  <!-- 顶部浮层，从左到右：连接/销毁 · 输入框/录音 · 键盘/语音，底部交给 SDK 原生字幕 -->
  <div class="controls" id="controls">
    <button class="ctrl-btn" id="btn-connect" title="连接 / 销毁"></button>

    <div class="input-wrap" id="input-wrap" hidden>
      <input id="text-input" placeholder="输入文字，回车发送" autocomplete="off" />
      <button id="btn-send" title="发送"></button>
    </div>
    <button class="ctrl-btn ctrl-mic" id="btn-mic" title="开始 / 停止录音" hidden></button>

    <button class="ctrl-btn" id="btn-mode" title="切换输入方式" hidden></button>
  </div>

  <!-- 端到端 SDK（CDN 加载，暴露全局 XingyunAvatarAgent） -->
  <script src="https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar_e2e@latest.js"><\/script>
  <script>
    'use strict';
    /* ============ 凭证（{{...}} 占位符预览时自动替换，独立运行请手填） ============ */
    const APP_ID = '{{appId}}';
    const APP_SECRET = '{{appSecret}}';
    const GATEWAY = '{{gatewayServer}}';
    if (APP_ID.startsWith('{{') || APP_SECRET.startsWith('{{')) {
      alert('请先配置 AppId / AppSecret（教学页「初始化 → 前置准备」）');
      throw new Error('应用凭证未配置');
    }

    /* ============ 状态与 DOM ============ */
    const $ = function (id) { return document.getElementById(id); };
    const statusEl = $('status');
    const statusText = $('status-text');
    // 布局目标容器的实际尺寸（横竖屏共用；取真实尺寸保证两种比例下对齐都正确）
    const width = $('avatar-container').clientWidth;
    const height = $('avatar-container').clientHeight;
    function setStatus(text, cls) {
      statusText.textContent = text;
      statusEl.className = cls || '';
    }

    let connected = false;   // 是否已完成 init（Agent running）
    let recording = false;   // 是否正在录音
    let mode = 'text';       // 'text' 文字输入 | 'voice' 语音输入

    /* ---------- init 加载进度浮层 ---------- */
    const loadingEl = $('loading');
    const loadingFill = $('loading-fill');
    const loadingText = $('loading-text');
    function setLoading(visible, pct) {
      loadingEl.hidden = !visible;
      if (!visible) return;
      const v = Math.min(100, Math.max(0, pct));
      loadingFill.style.width = v + '%';
      loadingText.textContent = '加载中 ' + v.toFixed(2) + '%'; // 保留两位小数
    }

    /* ============ 创建具身智能实例（最简配置） ============ */
    /* destroy 之后实例不可复用于再次 init，故每次连接都新建实例 */
    let avatar = null;
    function createAvatar() {
      return new XingyunAvatarAgent({
        containerId: '#avatar-container',
        appId: APP_ID,
        appSecret: APP_SECRET,
        gatewayServer: GATEWAY,
        // 布局：顶部对齐 + 按容器高度 90% 缩放，头部落到操作栏下方
        // （offset_y 前移头部，避开顶部浮层），底部留白给 SDK 原生字幕
        config: {
          layout: {
            container: { size: [width, height] },
            avatar: { v_align: 'top', h_align: 'center', scale: '90vh', offset_x: 0, offset_y: 50 },
          },
        },
        onMessage(error) {
          console.error('onMessage', error.code, error.message);
          setStatus(error.message || '未知错误', '');
        },
        agentCallbacks: {
          onAgentStateChange(state) {
            console.log('Agent 状态:', state);
            if (state === 'running') setStatus('已连接', 'online');
            else if (state === 'reconnecting') setStatus('重连中', 'connecting');
            else if (state === 'failed' || state === 'stopped' || state === 'destroyed') setStatus('未连接', '');
          },
          onASRResult(result) {   // 识别文本（临时/最终）
            console.log('ASR:', result.text, result.isFinal ? '(final)' : '');
          },
          onConversationChange(event) {
            console.log('对话:', event.state, event.text || '');
          },
          onError(error) {
            console.error('Agent 错误:', error.domain, error.code, error.message);
          },
        },
      });
    }

    /* ============ 图标（内联 SVG，随 currentColor 变色） ============ */
    const ICONS = {
      power:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
      send:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
      mic:      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
      stop:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
      keyboard: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/></svg>',
    };
    const btnConnect = $('btn-connect');
    const btnMic = $('btn-mic');
    function setMicBtn() {
      btnMic.innerHTML = recording ? ICONS.stop : ICONS.mic;
      btnMic.classList.toggle('recording', recording);
      btnMic.title = recording ? '停止录音' : '开始录音';
    }
    function renderIcons() {
      /* 连接/销毁：统一「开关」图标，已连接时按钮呈 teal「开启」态区分 */
      btnConnect.innerHTML = ICONS.power;
      btnConnect.classList.toggle('on', connected);
      $('btn-send').innerHTML = ICONS.send;
      /* 键盘/语音：显示「将要切换到的模式」——文字态显示麦克风，语音态显示键盘 */
      $('btn-mode').innerHTML = mode === 'text' ? ICONS.mic : ICONS.keyboard;
      $('btn-mode').title = mode === 'text' ? '切换到语音输入' : '切换到文字输入';
      setMicBtn();
    }
    renderIcons();

    /* ============ 连接 / 销毁 ============ */
    btnConnect.addEventListener('click', async function () {
      if (!connected) {
        try {
          setStatus('连接中…', 'connecting');
          setLoading(true, 0);
          avatar = createAvatar();      // 每次连接都新建实例（destroy 后实例不可复用）
          await avatar.init({
            onDownloadProgress(progress) {
              /* progress===100 可能在 init() 的 Promise resolve 之后才异步到达，
                 这里直接隐藏进度遮罩，避免把已隐藏的遮罩又拉回 100.00% 状态 */
              if (progress >= 100) setLoading(false, 0);
              else setLoading(true, progress);
            },
          });                           // 下载资源 → 建立会话 → running
          setLoading(false, 0);
          connected = true;
          onConnectionChanged();
          setStatus('已连接', 'online');
        } catch (e) {
          console.error(e);
          setLoading(false, 0);
          setStatus('连接失败：' + (e && e.message || e), '');
        }
      } else {
        try { await avatar.destroy('user_action'); } catch (e) { console.error(e); }
        avatar = null;
        connected = false;
        recording = false;            // 销毁时若正在录音，一并复位，避免下次连接后按钮错态
        onConnectionChanged();
        setStatus('未连接', '');
      }
      renderIcons();
    });

    /* 连接后展示「输入框/录音」与「键盘/语音」；未连接仅保留「连接」按钮 */
    function onConnectionChanged() {
      $('input-wrap').hidden = !(connected && mode === 'text');
      $('btn-mic').hidden = !(connected && mode === 'voice');
      $('btn-mode').hidden = !connected;
      renderIcons();
    }

    /* ============ 键盘 / 语音 切换：录音中先 stopASR 再切换 ============ */
    $('btn-mode').addEventListener('click', async function () {
      if (recording) {
        try { await avatar.stopASR(); } catch (e) { console.error(e); }
        recording = false;
        setStatus('已连接', 'online'); // 恢复状态，避免残留「聆听中…」
      }
      mode = mode === 'text' ? 'voice' : 'text';
      onConnectionChanged();
    });

    /* ============ 文字输入：回车或点击发送 → ask ============ */
    const input = $('text-input');
    const btnSend = $('btn-send');
    input.addEventListener('input', function () {
      btnSend.classList.toggle('show', input.value.trim() !== '');
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doAsk(); });
    btnSend.addEventListener('click', doAsk);
    async function doAsk() {
      const text = input.value.trim();
      if (!text || !connected) return;
      input.value = '';
      btnSend.classList.remove('show');
      try { await avatar.ask(text); }    // 文本 → Brain → 实时播报
      catch (e) { console.error(e); }
    }

    /* ============ 语音输入：mic → startASR 录音，录音中 stop → stopASR ============ */
    btnMic.addEventListener('click', async function () {
      if (!recording) {
        try {
          await avatar.startASR();       // 申请麦克风，开启流式识别
          recording = true;
          setStatus('聆听中…', '');
        } catch (e) {
          console.error(e);
          setStatus('录音失败', '');
        }
      } else {
        try { await avatar.stopASR(); } catch (e) { console.error(e); }
        recording = false;
        setStatus('已连接', 'online');
      }
      setMicBtn();
    });
  <\/script>
</body>
</html>`,
};