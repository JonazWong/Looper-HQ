# 页面预览工具使用指南

## 🎯 功能说明

这两个工具帮助你快速查看和比较项目中的所有页面：

1. **preview** - 在浏览器中实时预览页面（支持热重载）
2. **snapshot** - 将页面保存为离线 HTML 文件（方便比较不同版本）

---

## 📋 方案 1: 实时预览（推荐）

### 快速开始

```bash
# 预览 Dashboard 主页
pnpm preview app/(dashboard)/dashboard/page.tsx

# 预览案件管理页面
pnpm preview app/(dashboard)/cases/page.tsx

# 预览客户管理页面
pnpm preview app/(dashboard)/clients/page.tsx

# 预览登录页面
pnpm preview app/(auth)/login/page.tsx
```

### 支持的路径格式

```bash
# 完整路径
pnpm preview apps/web/app/[locale]/(dashboard)/cases/page.tsx

# 简化路径（推荐）
pnpm preview app/(dashboard)/cases/page.tsx

# 超简化路径
pnpm preview (dashboard)/cases

# 只写目录名
pnpm preview cases
```

### 工作原理

1. 自动启动开发服务器（如果未运行）
2. 转换文件路径为 URL（例如：`(dashboard)/cases` → `/zh/cases`）
3. 在浏览器中打开对应页面
4. 支持热重载 - 修改代码后自动刷新

### 优点

- ✅ 实时查看修改效果
- ✅ 支持所有 Next.js 功能（服务端渲染、API调用等）
- ✅ 可以交互操作（点击按钮、填写表单等）
- ✅ 自动热重载

---

## 📸 方案 2: 离线快照（用于比较版本）

### 安装依赖（首次使用）

```bash
# 安装 Playwright
pnpm add -D playwright

# 安装浏览器
pnpm exec playwright install chromium
```

### 使用方法

```bash
# 保存 Dashboard 页面快照
pnpm snapshot app/(dashboard)/dashboard/page.tsx

# 保存并指定输出文件名
pnpm snapshot (dashboard)/cases -o snapshots/cases-old.html

# 保存英文版本
pnpm snapshot dashboard --locale en

# 自定义视口大小（用于响应式测试）
pnpm snapshot cases --viewport 375x667  # iPhone SE
pnpm snapshot cases --viewport 1920x1080  # Desktop
```

### 快照存储位置

```
Looper-HQ/
├── snapshots/               # 默认输出目录
│   ├── dashboard-zh.html    # 中文版 Dashboard
│   ├── dashboard-en.html    # 英文版 Dashboard
│   ├── cases-zh.html        # 案件管理页面
│   ├── clients-zh.html      # 客户管理页面
│   └── ...
```

### 比较版本

```bash
# 1. 保存当前版本
pnpm snapshot cases -o snapshots/cases-new.html

# 2. 修改代码后保存新版本
# （修改 cases/page.tsx）
pnpm snapshot cases -o snapshots/cases-modified.html

# 3. 在浏览器中打开两个文件比较
```

### 优点

- ✅ 离线查看，不需要运行服务器
- ✅ 保存历史版本，方便前后对比
- ✅ 包含完整的 CSS 样式
- ✅ 可以分享给团队成员查看

---

## 📚 所有页面路径参考

### Dashboard 区域（登录后）

```bash
# 主页
pnpm preview app/(dashboard)/dashboard/page.tsx

# 案件管理
pnpm preview app/(dashboard)/cases/page.tsx
pnpm preview app/(dashboard)/cases/new/page.tsx
pnpm preview app/(dashboard)/cases/[id]/page.tsx

# 客户管理
pnpm preview app/(dashboard)/clients/page.tsx
pnpm preview app/(dashboard)/clients/new/page.tsx
pnpm preview app/(dashboard)/clients/[id]/page.tsx

# 搜索
pnpm preview app/(dashboard)/search/page.tsx

# 文档管理
pnpm preview app/(dashboard)/documents/page.tsx

# 日历
pnpm preview app/(dashboard)/calendar/page.tsx

# 发票
pnpm preview app/(dashboard)/invoices/page.tsx

# 设置
pnpm preview app/(dashboard)/settings/page.tsx

# 通知
pnpm preview app/(dashboard)/notifications/page.tsx

# 报告
pnpm preview app/(dashboard)/reports/page.tsx
```

### Auth 区域（登录前）

```bash
# 登录
pnpm preview app/(auth)/login/page.tsx

# 注册
pnpm preview app/(auth)/register/page.tsx
```

### 公开页面

```bash
# 案件搜索（公开）
pnpm preview app/[locale]/case-search/page.tsx

# 网站地图
pnpm preview app/[locale]/sitemap/page.tsx
```

---

## 💡 实用技巧

### 1. 快速批量预览

创建一个脚本保存所有重要页面：

```bash
#!/bin/bash
# save-all-snapshots.sh

echo "保存所有页面快照..."

pnpm snapshot dashboard -o snapshots/01-dashboard.html
pnpm snapshot cases -o snapshots/02-cases-list.html
pnpm snapshot cases/new -o snapshots/03-cases-new.html
pnpm snapshot clients -o snapshots/04-clients-list.html
pnpm snapshot clients/new -o snapshots/05-clients-new.html
pnpm snapshot search -o snapshots/06-search.html
pnpm snapshot documents -o snapshots/07-documents.html
pnpm snapshot calendar -o snapshots/08-calendar.html
pnpm snapshot settings -o snapshots/09-settings.html

echo "✅ 所有快照已保存到 snapshots/ 目录"
```

### 2. 对比工具推荐

- **Visual Studio Code**: 右键 → "Select for Compare" → 右键另一个文件 → "Compare with Selected"
- **Beyond Compare**: 专业的文件比较工具
- **在线工具**: https://www.diffchecker.com/

### 3. 自动化流程

```bash
# 发布前保存所有页面快照（作为备份）
git checkout main
pnpm snapshot dashboard -o backups/v1.0-dashboard.html

# 切换到新分支修改
git checkout feature/new-design
pnpm snapshot dashboard -o backups/v2.0-dashboard.html

# 比较两个版本
```

---

## 🔧 故障排查

### 问题1: "找不到文件"

确保路径正确：

```bash
# ✅ 正确
pnpm preview app/(dashboard)/cases/page.tsx
pnpm preview (dashboard)/cases

# ❌ 错误
pnpm preview dashboard/cases  # 缺少路由组括号
pnpm preview cases.tsx        # 不要包含文件扩展名
```

### 问题2: "端口已被占用"

开发服务器默认使用 3002 端口。如果已被占用：

```bash
# 先停止现有服务器
# Windows: Ctrl+C
# macOS/Linux: Ctrl+C

# 或者手动查找并结束进程
# Windows:
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3002 | xargs kill
```

### 问题3: Snapshot 保存失败

确保已安装 Playwright：

```bash
pnpm add -D playwright
pnpm exec playwright install chromium
```

---

## 📖 示例工作流

### 场景：重新设计案件列表页面

```bash
# 1. 保存当前版本作为参考
pnpm snapshot cases -o reference/cases-original.html

# 2. 启动实时预览
pnpm preview cases
# 浏览器会自动打开 http://localhost:3002/zh/cases

# 3. 修改代码 (apps/web/app/[locale]/(dashboard)/cases/page.tsx)
#    浏览器会自动刷新显示修改

# 4. 完成后保存新版本
pnpm snapshot cases -o reference/cases-redesigned.html

# 5. 在浏览器中打开两个 HTML 文件并排比较
```

---

## 🎨 高级用法

### 预览不同屏幕尺寸

```bash
# 手机视图
pnpm snapshot dashboard --viewport 375x667 -o snapshots/dashboard-mobile.html

# 平板视图
pnpm snapshot dashboard --viewport 768x1024 -o snapshots/dashboard-tablet.html

# 桌面视图
pnpm snapshot dashboard --viewport 1920x1080 -o snapshots/dashboard-desktop.html
```

### 中英文版本对比

```bash
# 保存中文版
pnpm snapshot cases --locale zh -o snapshots/cases-zh.html

# 保存英文版
pnpm snapshot cases --locale en -o snapshots/cases-en.html

# 并排打开检查翻译
```

---

## 📝 注意事项

1. **预览工具需要开发服务器** - 会自动启动，等待约10-15秒
2. **快照工具需要联网** - 首次安装 Playwright 需要下载浏览器（约300MB）
3. **快照包含内联样式** - 文件较大，但可以离线查看
4. **动态数据可能不同** - 快照捕获的是当时的数据状态

---

**创建日期**: 2026-02-18  
**工具位置**: `scripts/preview-page.ts`, `scripts/snapshot-page.ts`  
**配置文件**: `package.json` (preview 和 snapshot 命令)
