# CES 版本管理小助手

统一的版本发布计划管理系统，帮助版本经理管理前后端组件版本、生产局点版本对齐状态。

## 功能特性

- **发布计划管理**：创建、编辑、状态流转（草稿 → 待测试 → 待发布 → 已发布）
- **版本交付套件**：每个版本的完整"配方"，包含前端和20+后端组件的版本详情
- **局点版本视图**：麻将块地图展示全网28个生产局点的版本对齐状态
- **版本对比**：对比两个版本之间的组件变更差异
- **复制派生**：从已有版本快速创建新版本

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: SQLite + Prisma ORM
- **UI**: TailwindCSS + Radix UI
- **主题**: 深空科技风格 (Dark theme with neon accents)

## 快速开始

### 一键启动

```bash
# 克隆仓库
git clone https://github.com/tongpan110110/ces-version-manager.git
cd ces-version-manager

# 安装依赖
npm install

# 启动开发服务器（会自动初始化数据库）
npm run dev
```

就这么简单！访问 [http://localhost:3000](http://localhost:3000) 查看应用。

> **注意**：首次运行 `npm run dev` 时会自动执行数据库初始化，这是正常现象。

### 其他命令

```bash
# 查看数据库
npm run db:studio

# 运行种子数据脚本（可选）
npm run db:seed
```

## 项目结构

```
src/
├── app/
│   ├── (dashboard)/        # 带侧边栏布局的页面
│   │   ├── page.tsx        # 仪表盘
│   │   ├── plans/          # 发布计划列表和详情
│   │   ├── regions/        # 局点版本视图
│   │   └── diff/           # 版本对比
│   └── api/                # API 路由
│       ├── plans/          # 计划相关 API
│       ├── manifests/      # 交付套件 API
│       ├── regions/        # 局点 API
│       ├── config/         # 系统配置 API
│       └── dashboard/      # 仪表盘数据 API
├── components/
│   ├── layout/             # 布局组件
│   └── ui/                 # UI 基础组件
├── lib/
│   ├── db.ts               # Prisma 客户端
│   ├── types.ts            # TypeScript 类型定义
│   └── utils.ts            # 工具函数
└── prisma/
    ├── schema.prisma       # 数据库模型
    └── seed.ts             # 初始化数据脚本
```

## 数据模型

### 发布计划 (Plan)
- version: 版本号 (25.8.0, 25.8.1, 25.8.1.1)
- type: Release | Patch
- status: draft | testing | ready | released | deprecated

### 交付套件 (Manifest)
- 前端版本：CES-Portal 的目标版本
- 后端组件：22个组件的目标版本、变更类型、变更原因

### 局点 (Region)
- 28个生产局点
- 当前系统版本
- 前后端就绪状态

## 模拟数据

系统预置了以下模拟版本：

- **25.8.0** - 基线版本
- **25.8.1** - ces-go-api 升级
- **25.8.1.1** - task-center 补丁
- **25.8.2** - 前端更新 + 后端收敛 (当前基线)
- **25.8.3** - 待测试版本

局点版本分布：
- 广州友好 (灰度)、北京四、广州、上海一 → 25.8.2
- 新加坡、曼谷、雅加达 → 25.8.1.1
- 墨西哥城一、圣保罗一 → 25.8.1
- 约翰内斯堡 → 25.8.0

## 主要 API

```
GET    /api/plans              # 计划列表
POST   /api/plans              # 创建计划
GET    /api/plans/:id          # 计划详情
PUT    /api/plans/:id          # 更新计划
PATCH  /api/plans/:id/status   # 状态流转

GET    /api/manifests/:planId  # 获取交付套件
PUT    /api/manifests/:planId  # 更新交付套件
POST   /api/manifests/:planId/copy  # 复制创建新版本
GET    /api/manifests/:planId/diff  # 版本对比

GET    /api/regions            # 局点列表
PATCH  /api/regions/:id/version # 更新局点版本

GET    /api/dashboard          # 仪表盘数据
GET    /api/config             # 系统配置
```

## UI 主题

采用深空科技风格：
- 背景：深灰/黑色 (#0a0a0f)
- 主色：青色 (#00d4ff)
- 辅助：紫色 (#a855f7)、粉色 (#f472b6)
- 特效：发光阴影、玻璃态卡片

## 开发命令

```bash
npm run dev         # 开发服务器
npm run build       # 构建生产版本
npm run start       # 启动生产服务器
npm run lint        # 代码检查
npm run db:studio   # Prisma Studio 可视化数据库
```

## 后续规划

- [ ] 权限控制
- [ ] 导出 Excel
- [ ] 审计日志查看
- [ ] 需求/问题覆盖视图
- [ ] 实时通知
