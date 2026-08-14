# 星云智能体 SDK 教学平台

基于 [魔珐星云 XmovAvatar SDK](https://xingyun3d.com/) 的交互式教学应用，通过代码编辑 + 实时执行的方式，帮助开发者快速上手 3D 数字人驱动的全流程。

## 功能概览

### 初始化
- **前置准备** — 注册账号、获取凭证、环境要求说明
- **创建实例** — 填写 App ID / App Secret，一键创建数字人实例
- **连接/销毁** — 初始化、销毁、状态管理

### 交互功能
- **播报** — 驱动数字人说话，支持流式播报、打断
- **SSML** — 语音合成标记语言：停顿、注音、动作嵌入
- **KA（关键动作）** — 预设肢体动作与语义动作意图
- **情绪** — 面部表情 + 音色情感控制
- **隐身模式** — 暂停渲染节省资源
- **布局** — 数字人在容器中的位置、大小、对齐
- **行走** — 水平移动动画，适用于展厅引导
- **Widget** — 自定义 UI 组件渲染（图片、视频、字幕等）
- **状态切换** — Idle / Listen / Speak / Interactive Idle

### 智能体（具身智能体）
- **智能体构成** — 感知 → 大脑 → 表达 架构说明
- **环境准备** — 大模型（火山方舟 ARK）+ 语音识别（腾讯云 ASR）凭证配置
- **文本对话** — 用户输入 → 大模型推理 → 数字人播报
- **语音对话** — 麦克风录音 → ASR 识别 → 大模型 → 数字人播报

### 帮助
- **使用说明** — 编辑器用法、占位符注入、预置方法

## 技术栈

| 技术 | 用途 |
|------|------|
| [Vite](https://vitejs.dev/) | 开发与构建 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [CodeMirror](https://codemirror.net/) | 代码编辑器 |
| [Marked](https://marked.js.org/) | Markdown 文档渲染 |
| [XmovAvatar SDK](https://xingyun3d.com/) | 3D 数字人驱动 |
| [腾讯云语音识别 SDK](https://github.com/TencentCloud/tencentcloud-speech-sdk-js) | 实时语音识别 |
| [火山方舟 ARK](https://console.volcengine.com/ark) | 大模型 API |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 dev server（默认 http://localhost:3000）
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 项目结构

```
xingyun-learning/
├── index.html                  # 入口 HTML
├── public/
│   └── tencent-asr-sdk.js      # 腾讯云 ASR SDK（CDN 备选）
├── src/
│   ├── main.ts                 # 应用入口，初始化布局与主题
│   ├── types.ts                # TypeScript 类型定义
│   ├── components/
│   │   ├── action-bar.ts       # 操作按钮栏
│   │   ├── agent-config.ts     # 智能体配置表单
│   │   ├── avatar-panel.ts     # 数字人容器面板
│   │   ├── code-editor.ts      # CodeMirror 代码编辑器
│   │   ├── collapsible.ts      # 折叠面板
│   │   ├── docs-panel.ts       # Markdown 文档面板
│   │   ├── drawer.ts           # 右侧抽屉
│   │   ├── fullscreen.ts       # 全屏切换
│   │   ├── init-config.ts      # 初始化配置表单
│   │   ├── log-panel.ts        # 日志面板
│   │   └── sidebar.ts          # 左侧边栏
│   ├── core/
│   │   ├── avatar-manager.ts   # 数字人实例管理器
│   │   ├── code-executor.ts    # 代码执行沙箱
│   │   └── theme.ts            # 主题切换（明暗/系统）
│   ├── data/
│   │   ├── action-definitions.ts  # 所有 Tab 的操作按钮定义
│   │   ├── code-templates.ts      # 示例代码模板
│   │   └── ka-actions.ts          # KA 动作与情绪数据
│   ├── state/
│   │   └── app-state.ts        # 应用全局状态
│   ├── styles/
│   │   ├── main.css            # 全局样式
│   │   ├── sidebar.css         # 侧边栏样式
│   │   ├── editor.css          # 编辑器样式
│   │   └── components.css      # 组件通用样式
│   └── tabs/
│       └── tab-registry.ts     # Tab 定义与文档内容
├── docs/superpowers/           # 设计文档（仅本地参考）
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 依赖与脚本
```

## 使用流程

1. **启动项目** → `pnpm dev`，打开浏览器
2. **初始化** → 在「创建实例」Tab 填写 App ID / App Secret，点击执行
3. **体验功能** → 依次尝试播报、SSML、KA、情绪等交互功能
4. **智能体** → 配置大模型和语音识别凭证，体验文本/语音对话
5. **修改代码** → 在编辑器中修改示例代码，点击「执行」实时查看效果

## 凭证配置

教学过程中需要以下平台凭证：

| 平台 | 用途 | 获取地址 |
|------|------|----------|
| [魔珐星云](https://xingyun3d.com/) | 数字人 App ID / Secret | 平台控制台 |
| [火山方舟 ARK](https://console.volcengine.com/ark) | 大模型 API Key | API Key 管理 |
| [腾讯云语音识别](https://console.cloud.tencent.com/asr) | ASR SecretId / SecretKey | 访问管理 CAM |

> ⚠️ 所有凭证保存在浏览器 localStorage 中，请勿提交到代码仓库。

## License

MIT
