# 纯前端演示版本

这个版本可以直接部署到 Vercel 作为静态演示使用。

## 当前状态

- ✅ 前端页面完整可用
- ✅ UI 交互正常
- ⚠️  API 路由存在但暂无真实数据库连接
- ⚠️  数据操作会调用 API 但无持久化存储

## 使用方式

### 方案 1: 本地开发（推荐）

本地开发时使用 SQLite 数据库，完整功能可用：

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npm run db:push

# 3. 添加测试数据
npm run db:seed

# 4. 启动开发服务器
npm run dev
```

### 方案 2: Vercel 部署（演示）

部署到 Vercel 用于 UI 演示：

1. 代码会正常构建
2. 前端页面可正常访问
3. API 调用会失败（因为没有数据库）
4. 适合展示界面设计和交互流程

### 方案 3: 纯前端模拟数据（已完成）

我们已经创建并实现了以下文件用于纯前端演示：

- `src/lib/mockData.ts` - 模拟数据定义
- `src/hooks/useLocalData.ts` - localStorage 数据管理
  - `useLocalData()` - 通用 localStorage hook
  - `usePlans()` - Plans 数据管理
  - `useRegions()` - Regions 数据管理
  - `useConfigs()` - Settings 配置管理
  - `useDashboard()` - Dashboard 数据统计

所有页面已经修改为使用 localStorage hooks，包括：
- ✅ Dashboard 页面
- ✅ Plans 页面
- ✅ Regions 页面
- ✅ Settings 页面

现在可以完全在浏览器中使用，无需后端数据库支持。所有数据都存储在 localStorage 中。

## 生产部署建议

如需生产使用，建议：

1. **使用 Vercel Postgres**
   - 在 Vercel 项目中添加 Postgres 数据库
   - 修改 `prisma/schema.prisma` 使用 PostgreSQL
   - 配置环境变量

2. **使用其他云数据库**
   - PlanetScale (MySQL)
   - Supabase (PostgreSQL)
   - Neon (PostgreSQL)

3. **部署到支持 SQLite 的平台**
   - Railway
   - Fly.io
   - Render

## 文件说明

- `prisma/schema.prisma` - 当前使用 SQLite 配置
- `package.json` - 构建脚本已优化，只在构建时生成 Prisma Client
- `src/lib/mockData.ts` - 模拟数据（可选）
- `src/hooks/useLocalData.ts` - 本地数据管理（可选）
