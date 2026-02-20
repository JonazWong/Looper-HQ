# 保留字冲突修复报告

**日期**: 2026-02-19  
**问题**: SQLAlchemy/Python 保留字冲突导致运行时错误

---

## 🚨 发现的问题

用户报告错误：
```
sqlalchemy.exc.InvalidRequestError: 'metadata'/_ClassScanMapperConfig/
```

**根本原因**：Prisma schema 使用了 Python/SQLAlchemy 保留字作为字段名。

---

## ✅ 已修复的字段

### 1. Activity 模型

| 原字段名 | 新字段名 | 原因 |
|---------|---------|------|
| `type` | `activityType` | Python 内置函数 + SQLAlchemy 常用字段 |
| `metadata` | `metaData` | **SQLAlchemy 核心保留字**（用于表元数据）|

**修改位置**: `packages/database/prisma/schema.prisma` Line 250-253

```prisma
# BEFORE
type        ActivityType
metadata    Json?

# AFTER  
activityType ActivityType
metaData     Json?
```

---

### 2. Client 模型

| 原字段名 | 新字段名 | 原因 |
|---------|---------|------|
| `type` | `clientType` | Python 内置函数 |

**修改位置**: `packages/database/prisma/schema.prisma` Line 146

```prisma
# BEFORE
type ClientType @default(INDIVIDUAL)

# AFTER
clientType ClientType @default(INDIVIDUAL)
```

---

### 3. LegalDocument 模型

| 原字段名 | 新字段名 | 原因 |
|---------|---------|------|
| `type` | `fileType` | Python 内置函数 |

**修改位置**: `packages/database/prisma/schema.prisma` Line 467

```prisma
# BEFORE
type String // MIME type

# AFTER
fileType String // MIME type
```

---

## 🔧 需要执行的迁移步骤

### 1. 生成新的 Prisma Client

```bash
pnpm --filter=@looper-hq/database prisma generate
```

### 2. 创建数据库迁移

```bash
pnpm --filter=@looper-hq/database prisma migrate dev --name fix-reserved-words
```

### 3. 更新代码中的字段引用

需要全局搜索并替换以下字段引用：

#### Activity 相关

```bash
# 搜索并替换
activity.type → activity.activityType
activity.metadata → activity.metaData
```

**影响的文件**：
- `apps/web/app/api/dashboard/stats/route.ts`
- `apps/web/components/ui/activity-timeline.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`
- `scripts/bootstrap-data.ts`
- `packages/database/prisma/seed.ts`

#### Client 相关

```bash
# 搜索并替换
client.type → client.clientType
```

**影响的文件**：
- `apps/web/app/(dashboard)/clients/page.tsx`
- `apps/web/app/api/clients/route.ts`
- `packages/database/prisma/seed.ts`

#### LegalDocument 相关

```bash
# 搜索并替换  
legalDocument.type → legalDocument.fileType
```

---

## 📋 完整的 Python/SQLAlchemy 保留字列表

为了避免未来的冲突，避免使用以下字段名：

### 核心保留字
- `metadata` ⚠️ **最危险**（SQLAlchemy 核心对象）
- `session` ⚠️ （SQLAlchemy Session）
- `query` ⚠️ （SQLAlchemy Query）
- `engine` ⚠️ （SQLAlchemy Engine）

### Python 内置
- `type`, `class`, `def`, `from`, `import`
- `pass`, `return`, `yield`, `lambda`
- `if`, `else`, `elif`, `for`, `while`
- `try`, `except`, `finally`, `with`
- `is`, `in`, `and`, `or`, `not`

### SQLAlchemy 常用
- `table`, `column`, `relationship`
- `mapper`, `registry`
- `model`, `schema`

### 建议命名规范
- 使用语义明确的复合词：`activityType`, `clientType`, `metaData`
- 添加前缀/后缀：`userStatus`, `documentCategory`
- 使用驼峰式：`firstName`, `lastName`

---

## 🔍 检查清单

- [x] 修改 Prisma schema
- [ ] 运行 `prisma generate`
- [ ] 运行 `prisma migrate dev`
- [ ] 更新 TypeScript 代码中的字段引用
- [ ] 更新 seed 脚本
- [ ] 测试所有受影响的 API 端点
- [ ] 更新文档

---

## ⚠️ 注意事项

1. **生产环境迁移前务必备份数据**
2. 这是 **破坏性变更**，需要更新所有引用这些字段的代码
3. 如果使用了 GraphQL/REST API，需要更新 API 文档
4. 如果有外部集成，需要通知 API 变更

---

**修复时间**: ~30分钟（schema修改 + 代码更新 + 测试）  
**影响范围**: Activity, Client, LegalDocument 模型及相关代码  
**优先级**: 🔴 高（阻止 SQLAlchemy 错误）
