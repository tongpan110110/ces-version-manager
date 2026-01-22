# CES 版本管理小助手

统一的版本发布计划管理系统，帮助版本经理管理前后端组件版本、生产局点版本对齐状态。

## 功能特性

- **发布计划管理**：创建、编辑、状态流转（草稿 → 待测试 → 待发布 → 已发布）
- **版本交付套件**：每个版本的完整"配方"，包含前端和20+后端组件的版本详情
- **局点版本视图**：按 Ring 环分组展示37个生产局点的版本对齐状态
- **里程碑管理**：计划时间线、升级窗口、延期原因记录
- **版本对比**：对比两个版本之间的组件变更差异
- **复制派生**：从已有版本快速创建新版本

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: MySQL + mysql2（原生 SQL）
- **UI**: TailwindCSS + Radix UI
- **主题**: 深空科技风格 (Dark theme with neon accents)

## 快速开始

### Mac/Linux 开发环境

```bash
# 克隆仓库
git clone https://github.com/tongpan110110/ces-version-manager.git
cd ces-version-manager

# 安装依赖
npm install

# 启动开发服务器（无需数据库，使用 mock 数据）
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### Windows 生产环境部署

在 Windows 服务器上部署的完整步骤：

```cmd
REM 1. 克隆仓库并安装依赖
git clone https://github.com/tongpan110110/ces-version-manager.git
cd ces-version-manager
npm install

REM 2. 安装 MySQL
REM 访问 https://dev.mysql.com/downloads/installer/
REM 下载并安装 MySQL Installer
REM 选择 "Server only" 类型
REM 设置 root 密码（或留空）
REM 端口使用默认 3306

REM 3. 创建数据库
mysql -u root -p
CREATE DATABASE ces_version CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

REM 4. 导入表结构
mysql -u root -p ces_version < prisma\mysql-schema.sql

REM 5. 导入数据（包含所有计划、局点、里程碑等）
node scripts/import-to-mysql.js

REM 6. 配置环境变量（如需要）
REM 创建 .env 文件：
REM MYSQL_HOST=localhost
REM MYSQL_PORT=3306
REM MYSQL_USER=root
REM MYSQL_PASSWORD=
REM MYSQL_DATABASE=ces_version

REM 7. 启动应用
npm run build
npm start
```

应用运行在 `http://localhost:3000`，局域网内其他电脑可通过 `http://<服务器IP>:3000` 访问。

### 数据说明

系统包含以下预置数据：

- **37个局点**：按 Ring 0-4 分组，覆盖国内、亚太、非洲、拉美区域
- **2个版本线**：25.10.x、26.1.x
- **2个发布计划**：25.10.0（升级中）、26.1.0（测试中）
- **19个组件**：前端 CES-Portal + 18个后端组件
- **完整里程碑数据**：开发开始、测试开始、打包、升级窗口等
- **延期原因记录**：需求变更说明

## 项目结构

```
src/
├── app/
│   ├── (dashboard)/        # 带侧边栏布局的页面
│   │   ├── page.tsx        # 仪表盘
│   │   ├── plans/          # 发布计划列表和详情
│   │   ├── regions/        # 局点版本视图
│   │   ├── diff/           # 版本对比
│   │   └── settings/       # 系统设置
│   └── api/                # API 路由（MySQL + 原生 SQL）
│       ├── plans/          # 计划相关 API
│       ├── plans/[planId]/ # 计划详情、状态流转
│       ├── manifests/      # 交付套件 API
│       ├── regions/        # 局点 API
│       ├── config/         # 系统配置 API
│       ├── dashboard/      # 仪表盘数据 API
│       ├── version-lines/  # 版本线 API
│       └── components/     # 组件 API
├── components/
│   ├── layout/             # 布局组件
│   └── ui/                 # UI 基础组件
├── hooks/
│   ├── useAPI.ts           # API 调用 Hooks
│   └── useLocalData.ts     # localStorage 备用 Hooks
├── lib/
│   ├── db.ts               # MySQL 连接工具
│   ├── init-data.ts        # 初始化数据
│   └── utils.ts            # 工具函数
prisma/
└── mysql-schema.sql        # MySQL 表结构定义
scripts/
└── import-to-mysql.js      # 数据导入脚本
```

## 数据模型

### 发布计划 (Plan)
- version: 版本号 (25.10.0, 26.1.0)
- versionLine: 版本线 (25.10, 26.1)
- type: Feature Release | Patch
- status: draft | testing | ready | upgrading | released

### 交付套件 (Manifest)
- 前端版本：CES-Portal 的目标版本
- 后端组件：18个组件的目标版本、变更类型、变更原因

### 局点 (Region)
- 37个生产局点
- 当前版本（前端/后端）
- 目标版本
- 前后端就绪状态

### 里程碑 (Milestone)
- 开发开始、测试开始、打包日期
- 升级窗口（开始-结束日期）
- 延期原因记录

## 主要 API

```
GET    /api/plans              # 计划列表（支持筛选）
POST   /api/plans              # 创建计划
GET    /api/plans/:id          # 计划详情
PUT    /api/plans/:id          # 更新计划
PATCH  /api/plans/:id/status   # 状态流转

GET    /api/manifests/:planId  # 获取交付套件
PUT    /api/manifests/:planId  # 更新交付套件
POST   /api/manifests/:planId/copy  # 复制创建新版本
GET    /api/manifests/:planId/diff  # 版本对比

GET    /api/regions            # 局点列表
GET    /api/regions/:id        # 局点详情
PATCH  /api/regions/:id/version # 更新局点版本

GET    /api/dashboard          # 仪表盘统计数据
GET    /api/config             # 系统配置
POST   /api/config             # 保存配置
```

## 开发命令

```bash
npm run dev         # 开发服务器（localhost:3000）
npm run build       # 构建生产版本
npm start           # 启动生产服务器
npm run lint        # 代码检查
```

## 架构说明

- **数据库层**：使用 mysql2 + 原生 SQL，无 ORM 依赖
- **API 层**：Next.js API Routes，支持 fallback 模式（MySQL 不可用时返回 mock 数据）
- **前端层**：React Hooks，自动在 API 和 localStorage 之间切换

## UI 主题

采用深空科技风格：
- 背景：深灰/黑色 (#0a0a0f)
- 主色：青色 (#00d4ff)
- 辅助：紫色 (#a855f7)、粉色 (#f472b6)
- 特效：发光阴影、玻璃态卡片
