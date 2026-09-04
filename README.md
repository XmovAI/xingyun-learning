# 星云智能体 SDK 教学平台

基于 [魔珐星云端到端 SDK](https://xingyun3d.com/)（`XingyunAvatarAgent`）的交互式教学应用，通过「代码编辑 + 实时执行」的方式，帮助开发者快速上手具身交互智能体的 **感知 → 认知 → 表达** 全流程（ASR 语音识别 + LLM Brain 对话 + 实时播报）。

## 功能概览

侧边栏按「初始化 → 表达 → 感知&大脑 → 智能体Demo」组织；首次访问会展示新手引导，随时可在「帮助」中重看。

### 初始化
- **前置准备** — 平台架构简介、注册账号与获取凭证、环境要求、SDK 引入方式
- **创建实例** — 填写 App ID / App Secret / Gateway Server，一键创建端到端智能体（Agent）实例（「最简/完全配置」模板切换）
- **连接/销毁** — `init()` / `destroy()`、Agent 状态机、断线重连

### 表达
- **播报** — `speak()` 驱动：纯文本 / SSML（停顿、注音）、流式分段、带情绪、客户端打断
- **关键动作（KA）** — SSML 指令驱动预设肢体动作（ka / ka_intent）
- **情绪** — 面部表情 + 音色情感，可显式传参或由文本自动推测
- **隐身模式** — 暂停渲染节省资源；或纯 UI 隐藏/显示
- **布局** — 智能体在容器中的位置、大小、对齐（静态配置 / 运行时动态修改）
- **行走** — 水平移动动画，适用于展厅引导
- **Widget** — 播报中渲染图片、视频、链接等多媒体（`onWidgetEvent` / `proxyWidget`）
- **状态切换** — Idle / Interactive Idle / Listen，`interrupt()` 打断

### 感知&大脑
- **初始化** — Agent / ASR / Brain 回调与自定义服务配置；ASR / Brain 默认使用平台预置配置，开箱即用
- **文本对话** — `ask()` → Brain 多轮推理 → 实时播报
- **语音对话** — `startASR()` 麦克风 → 平台 ASR 识别 → 自动进入 Brain → 实时播报（可用 `features.auto_send_asr_to_llm` 关闭自动进 Brain，仅取识别文本）

### 智能体Demo
- **Demo** — 完整独立的具身智能体示例页面，在 iframe 沙箱中隔离运行（自带 SDK 加载与实例管理）

### 帮助
- **使用说明** — 编辑器用法、占位符注入、预置方法，可重播新手引导

## 技术栈

| 技术 | 用途 |
|------|------|
| [Vite](https://vitejs.dev/) | 开发与构建 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [CodeMirror](https://codemirror.net/) | 代码编辑器 |
| [Marked](https://marked.js.org/) | Markdown 文档渲染 |
| 魔珐星云端到端 SDK（`@xmov/avatar/agent` → `XingyunAvatarAgent`） | 渲染 + ASR + LLM Brain 对话闭环 |

端到端 SDK 通过 CDN 全局引入（见 `index.html`，暴露 `window.XingyunAvatarAgent`），沙箱内示例代码可直接 `new XingyunAvatarAgent(...)`；`@xmov/avatar` npm 包用于类型支持。ASR 与 Brain（LLM）默认使用平台预置配置，**无需自备外部 ASR / LLM 凭证**。

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
├── index.html                  # 入口 HTML（含端到端 SDK CDN 引入）
├── public/
│   └── agent-architecture.png  # 平台架构图（「前置准备」文档引用）
├── scripts/
│   └── merge-config-test.mjs   # 初始化配置合并逻辑测试
├── src/
│   ├── main.ts                 # 应用入口，初始化布局、主题与新手引导
│   ├── types.ts                # TypeScript 类型定义
│   ├── types/
│   │   └── xingyun-avatar-agent.d.ts  # @xmov/avatar/agent 类型占位声明
│   ├── components/
│   │   ├── action-bar.ts       # 操作按钮栏
│   │   ├── avatar-panel.ts     # 智能体容器面板
│   │   ├── code-editor.ts      # CodeMirror 代码编辑器
│   │   ├── collapsible.ts      # 折叠面板
│   │   ├── demo-preview.ts     # 智能体Demo iframe 预览层
│   │   ├── docs-panel.ts       # Markdown 文档面板
│   │   ├── drawer.ts           # 右侧抽屉
│   │   ├── fullscreen.ts       # 全屏切换
│   │   ├── guide-tour.ts       # 首次访问新手引导
│   │   ├── init-config.ts      # 初始化配置表单
│   │   ├── log-panel.ts        # 日志面板
│   │   └── sidebar.ts          # 左侧边栏
│   ├── core/
│   │   ├── avatar-manager.ts   # 智能体实例管理器
│   │   ├── code-executor.ts    # 代码执行沙箱
│   │   └── theme.ts            # 主题切换（明暗/系统）
│   ├── data/
│   │   ├── action-definitions.ts  # 所有 Tab 的操作按钮定义
│   │   └── code-templates.ts      # 示例代码模板（含智能体Demo HTML）
│   ├── state/
│   │   └── app-state.ts        # 应用全局状态
│   ├── styles/
│   │   ├── main.css            # 全局样式
│   │   ├── sidebar.css         # 侧边栏样式
│   │   ├── editor.css          # 编辑器样式
│   │   ├── components.css      # 组件通用样式
│   │   ├── mobile.css          # 移动端适配
│   │   └── guide.css           # 新手引导样式
│   └── tabs/
│       └── tab-registry.ts     # 一级/二级 Tab 定义与文档内容
├── docs/superpowers/           # 设计文档（仅本地参考）
├── pnpm-workspace.yaml         # pnpm 依赖构建白名单配置
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 依赖与脚本
```

## 使用流程

1. **启动项目** → `pnpm dev`，打开浏览器（首次访问展示新手引导）
2. **初始化** → 在「创建实例」Tab 填写 App ID / App Secret，点击执行
3. **体验表达能力** → 依次尝试播报（含 SSML）、KA、情绪、隐身、布局、行走、Widget、状态切换
4. **感知&大脑** → 在「初始化」确认 ASR / Brain 回调，体验文本对话与语音对话（平台预置配置，无需自备凭证）
5. **智能体Demo** → 在 iframe 预览中运行完整独立示例
6. **修改代码** → 在编辑器中修改示例代码，点击「执行」实时查看效果

## 凭证配置

教学仅需以下凭证：

| 平台 | 用途 | 获取地址 |
|------|------|----------|
| [魔珐星云](https://xingyun3d.com/) | App ID / App Secret | 平台控制台 |
| 魔珐星云（Gateway） | Agent 会话接口地址（`ttsa_v2`，默认已预填） | 项目方提供 |

语音识别（ASR）与对话大脑（Brain/LLM）**默认使用平台预置配置**，无需额外凭证；如需自定义 provider（`openai_compatible` / `anthropic` / `doubao` / `qwen`），在「感知&大脑 → 初始化」填写 `asr_config` / `brain_config` 后「重新加载」即可。

> ⚠️ 自定义配置中的密钥（如 `brain_config.api_key`）只应使用平台允许在浏览器侧使用的低权限凭证，不要放置云厂商 / LLM / ASR 的高权限 API Key。

## License

MIT