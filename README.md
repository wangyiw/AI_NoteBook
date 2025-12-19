# AI_NoteBook
AI笔记应用，快速记录和"润色"灵感
功能：
1.笔记的CRUD,AI流式生成润色后文本【万字不卡顿】,可选择的接受和拒绝，悬浮框形式的编辑交互
2.✨ **实时协同编辑**（基于 Yjs CRDT），多人同时编辑同一笔记，自动冲突解决
3.详细的 AI 交互的核心逻辑（如流处理、悬浮框组件）编写单元和组件测试。

---

# 快速开始（面试官开箱即用）

本项目为前后端分离：

- **后端**：FastAPI + SQLAlchemy + MySQL + Qwen-plus（通过 `LLM_URL/LLM_API_KEY` 调用）
- **前端**：React 18 + TypeScript + Vite（开发态通过 Vite proxy 转发到后端）

## 目录结构

- **后端入口**：`main.py`
- **后端配置**：`.env`（从 `.env.example` 复制）
- **前端目录**：`frontend/`

---

# 启动项目

下面以 Windows 为例（macOS/Linux 命令类似）。

## 1) 后端工程

python(fastapi)-mysql-Qwen-plus

### 启动前准备

#### A. 安装 Python 依赖（两种方式二选一）

方式 1：使用 `uv`（推荐，速度快）

```bash
uv venv
uv pip install -r requirements.txt
```

方式 2：使用 `pip`

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

#### B. 配置环境变量（API Key 安全与易用）

1. 复制配置模板：

```bash
copy .env.example .env
```

2. 编辑 `.env`，至少需要填写：

- **LLM_URL**：模型 API Base URL（项目默认已给出）
- **LLM_API_KEY**：你的模型 APIKey
- **MySQL 配置**：`MYSQL_HOST/MYSQL_PORT/MYSQL_DATABASE/MYSQL_USERNAME/MYSQL_PASSWORD`

`.env` 示例（仅示意）：

```env
ENV=dev

# 阿里云百炼获取
LLM_URL=https://ark.cn-beijing.volces.com/api/v3
LLM_API_KEY=YOUR_API_KEY_HERE

MYSQL_HOST=localhost
MYSQL_PORT=3306 #端口
MYSQL_DATABASE=ai_notebook #数据库名称
MYSQL_USERNAME=root #用户名
MYSQL_PASSWORD=your_password # 密钥
```

##### API Key 安全建议

- **不要**把真实 `LLM_API_KEY` 写进代码或提交到仓库（本项目已通过 `.env` 读取）。
- 面试官拿到项目时，只需要在 `.env` 中填写 `LLM_API_KEY` 即可运行。
- 如你需要录屏/截图展示，请使用脱敏后的 Key。

#### C. 准备 MySQL

你需要一个可用的 MySQL 实例（本机或远程均可）。

- 确保 `.env` 中的数据库连接信息正确
- 首次启动时，后端会自动建表（`Base.metadata.create_all`）

### 启动流程

#### 开发模式启动（uvicorn）

```bash
python main.py
```

或直接使用 uvicorn（可热重载）：

```bash
uvicorn main:app --host 0.0.0.0 --port 8123 --reload
```

#### 使用 `uv` 启动（推荐命令示例）

如果你希望全程使用 `uv` 来运行：

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8123 --reload
```

### 验证后端是否启动成功

- 健康检查：

```text
GET http://localhost:8123/health
```

- OpenAPI 文档：

```text
http://localhost:8123/docs
```

---

## 2) 前端工程

1. TypeScript： 项目使用 TypeScript，并尽可能不使用 any。
2. CSS 作用域化： 使用一种能确保组件样式隔离的方案，避免全局 CSS 污染。
3. 现代框架： 使用一个现代前端框架或库（例如 React, Vue）来构建此应用。
4. 基础用户体验：用户在使用过程中不应该出现白屏、crash 等完全无法使用应用的情况，在使用过程中用户体验应该得到保障。
5. 响应式设计： 你的应用必须在桌面端和主流移动设备宽度（例如 375px ~ 420px）上都具有良好的布局和可用性。

### 启动前端

进入前端目录安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认前端地址：

```text
http://localhost:3000
```

### 前端如何访问后端

开发态 Vite 已配置 proxy：

- 前端请求 `/api/**` 会被转发到 `http://localhost:8123/**`

你也可以通过环境变量直连后端（更适合部署/预览）：

- `frontend/.env` 增加：

```env
VITE_API_BASE_URL=http://localhost:8123
```

---

# 使用流程（从 0 到可用）

1. 启动 MySQL 并确认连接信息正确
2. 配置 `.env` 中的 `LLM_API_KEY` 与 MySQL 账号密码
3. 启动后端（`http://localhost:8123`）
4. 启动前端（`http://localhost:3000`）
5. 在页面中：

- 创建/编辑笔记
- 选中文本或全文触发 AI 润色
- 流式输出过程中可停止/重试
- 接受/拒绝润色结果

---

# 生产运行 / 部署参考
说明：`uv` **不是必须**。如果您没有 `uv`，直接使用 `pip + venv` 方式启动即可；`uv` 仅作为可选的依赖管理与加速工具。

## 后端（无 reload）

```bash
uvicorn main:app --host 0.0.0.0 --port 8123
```

如果你希望用 `uv` 运行：

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8123
```

## 前端（构建与预览）

```bash
npm run build
npm run preview
```

注意：生产部署时请配置 `VITE_API_BASE_URL` 指向真实后端地址。

---

# 常见问题（FAQ）

## 1) 后端启动报 LLM 配置不完整

- 检查 `.env` 是否存在
- 检查 `.env` 中 `LLM_API_KEY` 是否已填写

## 2) 前端请求失败 / 404

- 确认后端端口为 `8123`
- 开发态优先走 Vite proxy：前端请求以 `/api` 前缀发起
- 或设置 `VITE_API_BASE_URL` 指向后端

## 3) 数据库连接失败

- 检查 MySQL 是否启动
- 检查 `.env` 中 `MYSQL_HOST/MYSQL_PORT/...` 是否正确

---

# 🚀 实时协作功能

本项目已集成基于 **Yjs CRDT** 的实时协作编辑功能！

## 快速启动协作功能

### 方式一：一键启动（推荐）

```bash
start-all.bat
```

这将自动启动：
1. Yjs WebSocket 服务（端口 8124）
2. FastAPI 后端（端口 8123）
3. 前端开发服务器（端口 5173）

### 方式二：手动启动

```bash
# 终端 1: Yjs WebSocket 服务
npx y-websocket-server --port 8124

# 终端 2: FastAPI 后端
python main.py

# 终端 3: 前端
cd frontend
npm run dev
```

## 协作功能演示

1. 在浏览器 A 打开笔记：`http://localhost:5173/notes/{note_id}`
2. 在浏览器 B（或隐身窗口）打开同一笔记
3. 在任意浏览器中编辑，另一个浏览器实时同步
4. 右上角显示连接状态：🟢 已连接 / 🟠 同步中 / 🔴 未连接

---
