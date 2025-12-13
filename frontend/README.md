# AI 笔记

基于 React + TypeScript + Vite 构建的 AI 笔记应用，支持 AI 流式润色功能。

## 功能特性

- 📝 **笔记管理**：创建、编辑、删除笔记
- ✏️ **自动保存**：输入后 300ms 自动保存到数据库
- 🤖 **AI 润色**：支持全文或选中文本的流式润色
- 📱 **响应式布局**：适配桌面端和移动端（375px~420px）

## 快速开始（面试官请看这里）

### 方式一：一键启动（推荐）

**前提条件**：已安装 Node.js 18+ 和 Python 3.10+

```bash
# 1. 克隆项目后，进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 复制环境变量配置（可选，默认连接 localhost:8123）
cp .env.example .env

# 4. 启动前端开发服务器
npm run dev
```

前端访问：http://localhost:3000

### 方式二：后端配置

后端需要配置 LLM API Key 才能使用 AI 润色功能：

```bash
# 在项目根目录创建 .env 文件
cd ..  # 回到项目根目录

# 配置以下环境变量（参考 .env.example）
LLM_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=your_api_key_here  # 替换为你的阿里云 DashScope API Key
```

> **获取 API Key**：访问 [阿里云 DashScope](https://dashscope.console.aliyun.com/) 注册并获取 API Key

启动后端：
```bash
uv run python main.py
```

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 接口层
│   │   ├── endpoints.ts  # 接口地址配置（集中管理）
│   │   └── noteApi.ts    # 笔记相关 API
│   ├── components/       # 通用组件
│   │   ├── AIPolishModal/    # AI 润色弹窗
│   │   ├── EmptyState/       # 空状态
│   │   ├── ErrorMessage/     # 错误提示
│   │   └── Loading/          # 加载状态
│   ├── hooks/            # 自定义 Hooks
│   ├── pages/            # 页面组件
│   │   ├── NoteList/     # 笔记列表页 /notes
│   │   └── NoteDetail/   # 笔记详情页 /notes/:id
│   ├── styles/           # 全局样式
│   └── types/            # TypeScript 类型定义
├── index.html
├── package.json
└── vite.config.ts
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 |
| 语言 | TypeScript（严格模式，无 any） |
| 路由 | React Router v6 |
| 构建 | Vite 5 |
| 样式 | CSS Modules（作用域隔离） |

## 工程规范

- ✅ **TypeScript**：全量使用，尽量避免 any
- ✅ **CSS 作用域化**：使用 CSS Modules 确保样式隔离
- ✅ **用户体验**：Loading/空态/错误兜底，不会白屏 crash
- ✅ **响应式设计**：支持 375px~420px 移动端宽度

## 构建生产版本

```bash
npm run build
```

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 接口层
│   │   ├── endpoints.ts  # 接口地址配置
│   │   └── noteApi.ts    # 笔记相关 API
│   ├── components/       # 通用组件
│   │   ├── AIPolishModal/    # AI 润色弹窗
│   │   ├── EmptyState/       # 空状态
│   │   ├── ErrorMessage/     # 错误提示
│   │   └── Loading/          # 加载状态
│   ├── hooks/            # 自定义 Hooks
│   │   └── useDebounce.ts
│   ├── pages/            # 页面组件
│   │   ├── NoteList/     # 笔记列表页
│   │   └── NoteDetail/   # 笔记详情页
│   ├── styles/           # 全局样式
│   ├── types/            # TypeScript 类型定义
│   ├── App.tsx           # 根组件
│   └── main.tsx          # 入口文件
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 接口配置

所有接口地址集中在 `src/api/endpoints.ts`，可根据后端实际接口进行修改。

## 技术栈

- React 18
- TypeScript
- React Router v6
- Vite
- CSS Modules
