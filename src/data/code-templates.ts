// ============================================
// Code Templates — Default code per tab
// ============================================

export const CODE_TEMPLATES = {
  // --- 初始化 ---
  createInstance: `// 创建数字人实例
const APP_ID = '{{appId}}';
const APP_SECRET = '{{appSecret}}';
if (APP_ID.startsWith('{{') || APP_SECRET.startsWith('{{')) {
  log('请配置 AppId 与 AppSecret');
  throw new Error('应用凭证未配置');
}
const avatar = new XmovAvatar({
  containerId: '#avatar-container',
  appId: APP_ID,
  appSecret: APP_SECRET,
  gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',
  onMessage(error) {
    log('SDK 错误:', error.code, error.message);
  },
  onStatusChange(status) {
    const STATUS_NAME = { 0: '在线', 1: '离线', 4: '关闭', 5: '可见', 6: '隐身' };
    log('状态变更:', STATUS_NAME[status] ?? '未知状态 (' + status + ')');
  },
});`,

  createInstanceFull: `// 创建数字人实例（完整配置）
const APP_ID = '{{appId}}';
const APP_SECRET = '{{appSecret}}';
if (APP_ID.startsWith('{{') || APP_SECRET.startsWith('{{')) {
  log('请配置 AppId 与 AppSecret');
  throw new Error('应用凭证未配置');
}
const avatar = new XmovAvatar({
  containerId: '#avatar-container',
  appId: APP_ID,
  appSecret: APP_SECRET,
  gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',
  enableClientInterrupt: true,
  config: {
    layout: {
      container: { size: [360, 640] },
      avatar: { v_align: 'bottom', h_align: 'center', scale: 1, offset_x: 0, offset_y: 0 },
    },
    raw_audio: false,
  },
  onMessage(error) {
    log('SDK 错误:', error.code, error.message);
  },
  onStatusChange(status) {
    const STATUS_NAME = { 0: '在线', 1: '离线', 4: '关闭', 5: '可见', 6: '隐身' };
    log('状态变更:', STATUS_NAME[status] ?? '未知状态 (' + status + ')');
  },
  onRenderChange(state) {
    log('渲染状态:', state);
  },
  onVoiceStateChange(state, duration) {
    log('语音状态:', state, duration ? duration + 'ms' : '');
  },
  onSpeakStateChange(state, client_speak_id) {
    log('播报状态:', state, client_speak_id);
  },
  onNetworkInfo(info) {
    log('网络信息:', 'RTT=' + info.rtt + 'ms');
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
});`,

  destroy: `// 销毁实例
await avatar.destroy('user_action');`,

  // --- 播报 ---
  speakNormal: `// 纯文本播报
avatar.speak('你好，我是你的数字人助手！');`,

  speakSSML: `// SSML 播报
avatar.speak(\`
<speak>
  大家好，欢迎来到魔法星云！
  <break time="500ms"/>
  今天为大家展示数字人的播报能力。
</speak>
\`);`,

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

  speakInterrupt: `// 打断播报
avatar.speak('<speak>这是一段很长的播报内容，会被打断...</speak>');
await wait(1);
avatar.interrupt('user');
log('已打断播报');`,

  // --- SSML ---
  ssmlBreak: `// 停顿示例
avatar.speak(\`
<speak>
  第一句话说完。
  <break time="1s"/>
  停顿一秒后继续。
  <break time="500ms"/>
  再停半秒。
</speak>
\`);`,

  ssmlPhoneme: `// 注音示例
avatar.speak(\`
<speak>
  这项<phoneme py="mei3 di4">美的</phoneme>技术正在改变世界。
  <phoneme py="hang2 ye2">行业</phoneme>领先。
</speak>
\`);`,

  // --- KA ---
  kaAction: (action: string) => `// 关键动作: ${action}
avatar.speak(\`
<speak>
  大家好！
  <ue4event><type>ka</type><data><action_semantic>${action}</action_semantic></data></ue4event>
  感谢大家的关注。
</speak>
\`);`,

  kaIntent: (intent: string) => `// 动作意图: ${intent}
avatar.speak(\`
<speak>
  请看这里。
  <ue4event><type>ka_intent</type><data><ka_intent>${intent}</ka_intent></data></ue4event>
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
    return `// 情绪: ${emotion}
avatar.speak('<speak>${text}</speak>', true, true, {
  emotion: '${emotion}',
});`;
  },

  // --- 隐身模式 ---
  invisibleToggle: `// 切换隐身模式（开关式 API）
// 可见时调用 → 停止渲染 + 后端暂停推送
// 再次调用 → 恢复渲染 + 后端恢复推送
avatar.switchInvisibleMode();`,

  invisibleVisible: `// 纯 UI 隐藏/显示数字人（不影响渲染和后端推送）
avatar.changeAvatarVisible(false);   // 隐藏 Canvas
// avatar.changeAvatarVisible(true); // 重新显示`,

  // --- 状态切换 ---
  stateIdle: `// 空闲状态 — 数字人停止当前动作，进入静默待机动画
avatar.idle();`,

  stateInteractiveIdle: `// 交互空闲 — 表示数字人处于可交互的等待状态
avatar.interactiveidle();`,

  stateListen: `// 聆听状态 — 表示数字人正在聆听用户输入
avatar.listen();`,

  stateInterrupt: `// 调用interrupt或speak，都可打断上一段未播报完毕的语音
avatar.speak('<speak>这是一段较长的语音，用来演示打断效果。数字人将持续播报这段话，请在播放过程中观察打断。</speak>');
await wait(2);
const latency = avatar.interrupt('user');
log('打断耗时:', latency, 'ms');
await wait(1);
avatar.speak('<speak>这是一段较长的语音，用来演示打断效果。数字人将持续播报这段话，请在播放过程中观察打断。</speak>');
await wait(2);
avatar.speak('<speak>开始第二段话。</speak>');`,

  // --- 行走 ---
  walkDefine: `// 定义行走点位
avatar.changeWalkConfig({
  walk_points: {
    A: 0, B: 200, C: 400, D: 600, E: 800
  },
  init_point: 400,
});
log('点位定义完成');`,

  walkGo: `// 触发行走
avatar.speak(\`
<speak>
  <ue4event><type>walk</type><data><target>B</target></data></ue4event>
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
  widgetCustomEvent: `// 自定义事件：图片 + 视频
avatar.speak(\`
<speak>
  <uievent><type>show_image</type><data><image>https://example.com/1.png</image><title>图片1</title></data></uievent>
  首先展示图片。
  <uievent><type>show_video</type><data><video>https://example.com/demo.mp4</video><cover>https://example.com/c.jpg</cover><title>视频</title></data></uievent>
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

  // --- 智能体：文本对话 ---
  agentTextChat: `// =============================================
// 文本对话：用户输入 → 大模型 → 数字人播报
// =============================================

// 配置在「环境准备」tab 填写，点击「执行」时注入；未配置时占位符触发报错
const BASE_URL = '{{baseUrl}}';
const API_KEY = '{{apiKey}}';
const MODEL_ID = '{{modelId}}';

if (BASE_URL.startsWith('{{') || API_KEY.startsWith('{{')) {
  log('error', '请在「环境准备」tab 配置 Base URL 与 API Key');
  throw new Error('LLM 配置不完整');
}
if (MODEL_ID.startsWith('{{')) {
  log('error', '请在「环境准备」tab 配置模型 ID');
  throw new Error('模型 ID 未配置');
}

// 1. 获取用户输入
const userInput = prompt('请输入你想对数字人说的话：');
if (!userInput) {
  log('warn', '已取消输入');
  return;
}
log('log', '用户：', userInput);

// 2. 调用大模型
log('info', '正在请求大模型...');
const resp = await fetch(BASE_URL + '/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + API_KEY,
  },
  body: JSON.stringify({
    model: MODEL_ID,
    messages: [
      { role: 'system', content: '你是魔法星云的数字人助手，请用简短友好的语气回复，30字以内。' },
      { role: 'user', content: userInput },
    ],
  }),
});

if (!resp.ok) {
  const errText = await resp.text().catch(() => '未知错误');
  throw new Error('HTTP ' + resp.status + ': ' + errText.slice(0, 200));
}

const data = await resp.json();
const reply = data.choices[0].message.content;
log('log', '大模型回复：', reply);

// 3. 数字人播报
if (typeof avatar !== 'undefined' && avatar) {
  avatar.speak(reply);
  log('info', '数字人开始播报...');
} else {
  log('warn', '数字人实例未创建，请先在初始化 tab 创建连接');
}
`,

  // --- 智能体：语音对话 ---
  agentVoiceChat: `// =============================================
// 语音对话：录音 → ASR（腾讯云 SDK）→ 大模型 → 数字人播报
// =============================================

// 配置在「环境准备」tab 填写，点击「执行」时注入；未配置时占位符触发报错
const BASE_URL = '{{baseUrl}}';
const API_KEY = '{{apiKey}}';
const MODEL_ID = '{{modelId}}';
const ASR_SECRET_ID = '{{asrSecretId}}';
const ASR_SECRET_KEY = '{{asrSecretKey}}';
const ASR_APP_ID = '{{asrAppId}}';
const ASR_ENGINE = '{{asrEngineModel}}';

if (BASE_URL.startsWith('{{') || API_KEY.startsWith('{{')) {
  log('error', '请在「环境准备」tab 配置 Base URL 与 API Key');
  throw new Error('LLM 配置不完整');
}
if (MODEL_ID.startsWith('{{')) {
  log('error', '请在「环境准备」tab 配置模型 ID');
  throw new Error('模型未选择');
}
if (ASR_SECRET_ID.startsWith('{{') || ASR_SECRET_KEY.startsWith('{{')) {
  log('error', '请在「环境准备」tab 填写 ASR SecretId / SecretKey');
  throw new Error('ASR 凭证未配置');
}

// 1. 使用腾讯云语音识别 SDK（WebAudioSpeechRecognizer）
const { WebAudioSpeechRecognizer } = window;
if (!WebAudioSpeechRecognizer) {
  throw new Error('ASR SDK 未加载，请刷新页面重试');
}

const recognizer = new WebAudioSpeechRecognizer({
  // HMAC-SHA1 签名函数（SDK 要求提供，用 CryptoJSTest 计算）
  signCallback(signStr) {
    log('log', 'ASR 签名参数:', 'AppId=' + ASR_APP_ID + ', SecretId=' + (ASR_SECRET_ID.slice(0,6) + '***' + ASR_SECRET_ID.slice(-4)));
    const hash = CryptoJSTest.HmacSHA1(signStr, ASR_SECRET_KEY);
    const words = hash.words;
    const bytes = new Uint8Array(words.length * 4);
    for (let i = 0; i < words.length; i++) {
      bytes[i*4] = (words[i] >>> 24) & 0xff;
      bytes[i*4+1] = (words[i] >>> 16) & 0xff;
      bytes[i*4+2] = (words[i] >>> 8) & 0xff;
      bytes[i*4+3] = words[i] & 0xff;
    }
    const sig = btoa(String.fromCharCode(...bytes));
    log('log', 'ASR 签名已生成（前16字符）:', sig.slice(0, 16) + '...');
    return sig;
  },
  secretid: ASR_SECRET_ID,
  secretkey: ASR_SECRET_KEY,
  appid: ASR_APP_ID,
  engine_model_type: ASR_ENGINE || '16k_zh',
  voice_format: 1, // PCM
});

// 2. 设置识别回调
const resultPromise = new Promise((resolve, reject) => {
  recognizer.OnSentenceEnd = (res) => {
    const text = res?.voice_text_str || '';
    if (text) resolve(text);
    else resolve('');
  };
  recognizer.OnError = (err) => {
    reject(new Error(typeof err === 'string' ? err : err?.message || 'ASR 错误'));
  };
});

// 3. 开始录音识别
recognizer.start();
log('info', '正在录音，请说话...');

// 4. 非阻塞结束按钮
const stopBtn = document.createElement('button');
stopBtn.textContent = '⏹ 结束录音并识别';
stopBtn.style.cssText =
  'position:fixed;top:16px;right:16px;z-index:2147483647;' +
  'padding:12px 18px;font-size:15px;background:#ef4444;color:#fff;' +
  'border:none;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.3);cursor:pointer;';
document.body.appendChild(stopBtn);
const stopSignal = new Promise((resolve) => { stopBtn.onclick = resolve; });
await stopSignal;
stopBtn.remove();
log('info', '录音结束，正在识别...');

// 5. 停止识别，等待结果（10s 超时防挂死）
recognizer.stop();
const recognizedText = await Promise.race([
  resultPromise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('识别超时（10s）')), 10000)),
]);

if (!recognizedText) {
  log('error', '未识别到文本');
  return;
}
log('log', '识别文本：', recognizedText);

// 6. 调用大模型
log('info', '正在请求大模型...');
const resp = await fetch(BASE_URL + '/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + API_KEY,
  },
  body: JSON.stringify({
    model: MODEL_ID,
    messages: [
      { role: 'system', content: '你是魔法星云的数字人助手，请用简短友好的语气回复，30字以内。' },
      { role: 'user', content: recognizedText },
    ],
  }),
});

if (!resp.ok) {
  const errText = await resp.text().catch(() => '未知错误');
  throw new Error('HTTP ' + resp.status + ': ' + errText.slice(0, 200));
}

const data = await resp.json();
const reply = data.choices[0].message.content;
log('log', '大模型回复：', reply);

// 7. 数字人播报
if (typeof avatar !== 'undefined' && avatar) {
  avatar.speak(reply);
  log('info', '数字人开始播报...');
} else {
  log('warn', '数字人实例未创建，请先在初始化 tab 创建连接');
}
`,
};
