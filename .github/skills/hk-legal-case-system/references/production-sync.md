# 生產環境資料庫同步指南

## 概述

本指南說明如何在本地開發環境與 DigitalOcean (DO) 生產環境之間同步 PublicCase 資料，以及如何驗證同步完整性。

## 環境配置

### 本地環境 (.env.local)

```bash
# 本地開發資料庫
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/looper_hq"
```

### 生產環境連線 (.env.production)

```bash
# DO 生產資料庫（從 DO Console 取得）
PROD_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

**⚠️ 安全提示**: 
- **絕對不要** commit `.env.production` 到 Git
- 使用 SSH tunnel 連線到生產資料庫
- 限制生產資料庫 IP 白名單

## 同步策略

### 策略 A: 僅同步爬蟲資料（推薦）

生產環境的爬蟲每日自動執行，本地開發通常不需要完整生產資料。只在需要調試時同步最近資料。

```bash
# 1. 從生產環境匯出最近 7 天資料
PGPASSWORD=<password> pg_dump \
  -h <prod_host> \
  -U <username> \
  -d <database> \
  --table="PublicCase" \
  --where="\"createdAt\" > NOW() - INTERVAL '7 days'" \
  --data-only \
  --column-inserts \
  > recent_public_cases.sql

# 2. 匯入到本地
psql -h localhost -U postgres -d looper_hq -f recent_public_cases.sql
```

### 策略 B: 定期完整備份（用於災難恢復）

```bash
# 每週備份生產資料庫
PGPASSWORD=<password> pg_dump \
  -h <prod_host> \
  -U <username> \
  -d <database> \
  --format=custom \
  --file=backup_$(date +%Y%m%d).dump

# 保留最近 4 週備份
find . -name "backup_*.dump" -mtime +28 -delete
```

### 策略 C: 使用 SSH Tunnel（安全連線）

```bash
# 1. 建立 SSH tunnel
ssh -L 5433:localhost:5432 user@do-droplet-ip

# 2. 透過 tunnel 連線（本地 5433 → DO 5432）
DATABASE_URL="postgresql://username:password@localhost:5433/database" \
  pnpm --filter=@looper-hq/database prisma studio

# 現在可以直接在 Prisma Studio 查看生產資料
```

## Prisma Migration 同步

### 開發流程

```bash
# 1. 本地開發時使用 db:push（不建立 migration）
pnpm db:push

# 2. 確認功能正常後，建立正式 migration
pnpm db:migrate
# 輸入名稱: add_citations_table

# 3. Commit migration 檔案
git add packages/database/prisma/migrations
git commit -m "feat(db): add citations table"
```

### 生產部署

```bash
# 在 DO Droplet 上執行（或透過 CI/CD）
cd /var/www/looper-hq
git pull origin main

# 執行 migration（自動套用所有新 migration）
pnpm --filter=@looper-hq/database prisma migrate deploy

# 重啟應用
pm2 restart looper-web
```

## 資料完整性驗證

### 腳本 1: 本地 vs 生產資料對比

```typescript
// scripts/compare-db-stats.ts
import { PrismaClient } from '@looper-hq/database';

const localPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const prodPrisma = new PrismaClient({
  datasources: { db: { url: process.env.PROD_DATABASE_URL } },
});

async function compareStats() {
  const [localStats, prodStats] = await Promise.all([
    localPrisma.publicCase.groupBy({
      by: ['source'],
      _count: true,
    }),
    prodPrisma.publicCase.groupBy({
      by: ['source'],
      _count: true,
    }),
  ]);

  console.log('本地環境:');
  localStats.forEach(s => console.log(`  ${s.source}: ${s._count}`));

  console.log('\n生產環境:');
  prodStats.forEach(s => console.log(`  ${s.source}: ${s._count}`));

  await localPrisma.$disconnect();
  await prodPrisma.$disconnect();
}

compareStats();
```

### 腳本 2: 檢查缺失資料

```typescript
// scripts/find-missing-records.ts
// 找出生產環境有但本地缺少的記錄

const prodExternalIds = await prodPrisma.publicCase.findMany({
  where: { source: 'RSS' },
  select: { externalId: true },
});

const localExternalIds = await localPrisma.publicCase.findMany({
  where: { source: 'RSS' },
  select: { externalId: true },
});

const prodSet = new Set(prodExternalIds.map(p => p.externalId));
const localSet = new Set(localExternalIds.map(l => l.externalId));

const missingInLocal = [...prodSet].filter(id => !localSet.has(id));
console.log(`本地缺少 ${missingInLocal.length} 筆生產資料`);
```

## GitHub Actions 生產爬蟲監控

### 查看執行狀態

```bash
# 方法 1: GitHub UI
https://github.com/JonazWong/Looper-HQ/actions/workflows/crawler.yml

# 方法 2: GitHub CLI
gh run list --workflow=crawler.yml --limit 10
gh run view <run_id> --log
```

### 觸發手動執行

```bash
# 透過 GitHub UI: Actions → Daily Case Tracking → Run workflow

# 或使用 CLI
gh workflow run crawler.yml
```

### 失敗通知設定

在 `.github/workflows/crawler.yml` 添加通知步驟：

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '爬蟲執行失敗！檢查 GitHub Actions 日誌'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 常見同步問題

### 問題 1: 本地爬蟲成功但生產環境失敗

**可能原因**:
- 生產環境 IP 被來源網站封鎖
- 環境變數缺失或錯誤
- 資料庫連線問題

**診斷步驟**:
```bash
# 1. SSH 到 DO Droplet
ssh user@droplet-ip

# 2. 查看應用日誌
pm2 logs looper-web --lines 100

# 3. 手動執行爬蟲
cd /var/www/looper-hq
NODE_ENV=production pnpm crawler:all

# 4. 檢查資料庫連線
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"PublicCase\";"
```

### 問題 2: Migration 衝突

**場景**: 本地 migration 與生產不一致

**解決方法**:
```bash
# 1. 檢查 migration 狀態
pnpm --filter=@looper-hq/database prisma migrate status

# 2. 如果有未套用的 migration
pnpm --filter=@looper-hq/database prisma migrate deploy

# 3. 如果 migration 歷史損壞（極端情況）
pnpm --filter=@looper-hq/database prisma migrate resolve --applied <migration_name>
```

### 問題 3: 資料重複（同步後出現重複記錄）

**原因**: `source_externalId` unique constraint 未正確工作

**修復**:
```sql
-- 1. 找出重複資料
SELECT source, "externalId", COUNT(*) as count
FROM "PublicCase"
GROUP BY source, "externalId"
HAVING COUNT(*) > 1;

-- 2. 保留最新記錄，刪除舊記錄
DELETE FROM "PublicCase" p1
USING "PublicCase" p2
WHERE p1.source = p2.source 
  AND p1."externalId" = p2."externalId"
  AND p1.id < p2.id;

-- 3. 確保 unique constraint 存在
ALTER TABLE "PublicCase" 
ADD CONSTRAINT "PublicCase_source_externalId_key" 
UNIQUE (source, "externalId");
```

## 自動化同步腳本

### 每週本地資料更新

```bash
#!/bin/bash
# scripts/sync-from-production.sh

echo "🔄 從生產環境同步資料..."

# 1. 備份本地資料庫
pg_dump looper_hq > backup_local_$(date +%Y%m%d).sql

# 2. 建立 SSH tunnel
ssh -f -N -L 5433:localhost:5432 user@droplet-ip
sleep 2

# 3. 匯出生產資料（最近 30 天）
PGPASSWORD=$PROD_PASSWORD pg_dump \
  -h localhost -p 5433 \
  -U $PROD_USER \
  -d $PROD_DB \
  --table="PublicCase" \
  --where="\"createdAt\" > NOW() - INTERVAL '30 days'" \
  --data-only \
  > prod_recent.sql

# 4. 清理本地舊資料
psql looper_hq -c "DELETE FROM \"PublicCase\" WHERE \"createdAt\" < NOW() - INTERVAL '30 days';"

# 5. 匯入生產資料
psql looper_hq -f prod_recent.sql

# 6. 關閉 SSH tunnel
pkill -f "ssh.*5433:localhost:5432"

echo "✅ 同步完成"

# 7. 驗證資料完整性
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts
```

## 最佳實踐

### 1. 分離開發與生產資料
- 本地開發使用 Docker PostgreSQL
- 避免直接修改生產資料庫
- 使用 `db:push` 快速迭代，正式發佈前建立 migration

### 2. 定期備份
```bash
# crontab 設定（每日凌晨 3 點）
0 3 * * * /var/www/looper-hq/scripts/backup-database.sh
```

### 3. 監控爬蟲健康度
```bash
# 每小時檢查爬蟲狀態
0 * * * * tsx /var/www/looper-hq/scripts/crawlers/health-check.ts
```

### 4. Schema 變更檢查清單

在修改 Prisma schema 前：
- [ ] 備份生產資料庫
- [ ] 在本地測試 migration
- [ ] 檢查是否有資料遺失風險
- [ ] 合併前進行 peer review
- [ ] 部署時監控應用健康度

### 5. 使用 Prisma Studio 安全連線

```bash
# 永遠不要直接連線生產環境
# 使用 SSH tunnel + 唯讀角色

# 1. 建立唯讀資料庫角色
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'xxx';
GRANT CONNECT ON DATABASE looper_hq TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

# 2. 透過 tunnel 連線
ssh -L 5433:localhost:5432 user@droplet-ip
DATABASE_URL="postgresql://readonly_user:xxx@localhost:5433/looper_hq" \
  pnpm --filter=@looper-hq/database prisma studio
```

---

**更新日期**: 2026-03-26  
**版本**: 1.0  
**維護者**: Looper HQ Team
