#!/usr/bin/env bash
set -euo pipefail

# ========= 基本設定 =========
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/.install_backups"
LOG_FILE="${PROJECT_ROOT}/install.log"

mkdir -p "${BACKUP_DIR}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

abort() {
  log "安裝失敗：$*"
  log "如需回復，請執行：scripts/uninstall.sh --rollback-latest"
  exit 1
}

# ========= 快照與備份 =========
create_snapshot() {
  SNAPSHOT_ID="$(date '+%Y%m%d-%H%M%S')"
  SNAPSHOT_PATH="${BACKUP_DIR}/${SNAPSHOT_ID}"
  mkdir -p "${SNAPSHOT_PATH}"

  log "建立安裝前快照：${SNAPSHOT_ID}"

  # 1. 備份環境變數與配置
  if [ -f "${PROJECT_ROOT}/.env" ]; then
    cp "${PROJECT_ROOT}/.env" "${SNAPSHOT_PATH}/.env.bak"
  fi

  if [ -d "${PROJECT_ROOT}/config" ]; then
    tar czf "${SNAPSHOT_PATH}/config.tar.gz" -C "${PROJECT_ROOT}" config
  fi

  # 2. 資料庫 Schema 快照（依實際 DB 調整）
  # 例：PostgreSQL
  if command -v pg_dump >/dev/null 2>&1; then
    if [ -n "${DB_NAME:-}" ] && [ -n "${DB_USER:-}" ]; then
      log "備份資料庫結構（只 schema，不含資料）"
      pg_dump --schema-only -U "${DB_USER}" "${DB_NAME}" > "${SNAPSHOT_PATH}/db_schema.sql" || \
        log "警告：資料庫 schema 備份失敗（可忽略，視情況調整）"
    fi
  fi

  echo "${SNAPSHOT_ID}" > "${BACKUP_DIR}/latest"
}

# ========= 環境檢查 =========
check_prerequisites() {
  log "檢查系統環境..."

  # 例：Node.js + npm
  if ! command -v node >/dev/null 2>&1; then
    abort "未找到 node，請先安裝 Node.js"
  fi
  if ! command -v npm >/dev/null 2>&1; then
    abort "未找到 npm，請先安裝 npm"
  fi

  # 例：Git
  if ! command -v git >/dev/null 2>&1; then
    abort "未找到 git，請先安裝 Git"
  fi

  # 例：PostgreSQL client
  if ! command -v psql >/dev/null 2>&1; then
    log "警告：未找到 psql，部分資料庫相關操作可能無法完成"
  fi

  log "環境檢查完成。"
}

# ========= 分模組安裝 =========

install_search_crawler() {
  log "開始安裝：搜尋爬蟲模組"

  # 依專案實際路徑調整，例如 services/crawler
  local CRAWLER_DIR="${PROJECT_ROOT}/services/crawler"
  if [ -d "${CRAWLER_DIR}" ]; then
    pushd "${CRAWLER_DIR}" >/dev/null

    # 例：Node.js crawler
    if [ -f package.json ]; then
      npm install
    fi

    # 例：Python crawler
    if [ -f requirements.txt ]; then
      pip install -r requirements.txt
    fi

    popd >/dev/null
  else
    log "略過：未找到搜尋爬蟲模組目錄 ${CRAWLER_DIR}"
  fi

  log "完成：搜尋爬蟲模組安裝"
}

install_database_layer() {
  log "開始安裝：資料庫與管理模組"

  # 設定資料庫（依專案調整）
  # 1. 建立資料庫（如需要）
  if command -v createdb >/dev/null 2>&1 && [ -n "${DB_NAME:-}" ]; then
    createdb "${DB_NAME}" 2>/dev/null || log "資料庫 ${DB_NAME} 已存在，略過建立"
  fi

  # 2. 執行 migration（依你的 migration 工具調整，如 Prisma、Knex、Alembic 等）
  local API_DIR="${PROJECT_ROOT}/services/api"
  if [ -d "${API_DIR}" ]; then
    pushd "${API_DIR}" >/dev/null

    if [ -f package.json ]; then
      npm install
      if npm run | grep -q "migrate"; then
        npm run migrate || abort "資料庫 migration 失敗"
      fi
    fi

    popd >/dev/null
  fi

  log "完成：資料庫與管理模組安裝"
}

install_backend_frontend() {
  log "開始安裝：後端 / 前端"

  # 1. 後端
  local API_DIR="${PROJECT_ROOT}/services/api"
  if [ -d "${API_DIR}" ]; then
    pushd "${API_DIR}" >/dev/null
    if [ -f package.json ]; then
      npm install
      # 可選：npm run build
    fi
    popd >/dev/null
  fi

  # 2. 前端
  local WEB_DIR="${PROJECT_ROOT}/services/web"
  if [ -d "${WEB_DIR}" ]; then
    pushd "${WEB_DIR}" >/dev/null
    if [ -f package.json ]; then
      npm install
      # 可選：npm run build
    fi
    popd >/dev/null
  fi

  log "完成：後端 / 前端安裝"
}

bootstrap_pages_and_relations() {
  log "開始初始化：預設頁面、關聯與基礎資料"

  # 建議用一支專門腳本處理，語言依你專案而定
  # 例如：node scripts/bootstrap_data.js 或 python scripts/bootstrap_data.py
  if [ -f "${PROJECT_ROOT}/scripts/bootstrap_data.js" ]; then
    node "${PROJECT_ROOT}/scripts/bootstrap_data.js" || abort "初始化頁面與關聯失敗"
  elif [ -f "${PROJECT_ROOT}/scripts/bootstrap_data.py" ]; then
    python "${PROJECT_ROOT}/scripts/bootstrap_data.py" || abort "初始化頁面與關聯失敗"
  else
    log "略過：未找到 bootstrap_data 腳本，請日後補上"
  fi

  log "完成：初始化預設頁面與關聯"
}

generate_install_guide() {
  log "生成安裝架構指南..."

  local DOC_DIR="${PROJECT_ROOT}/docs"
  mkdir -p "${DOC_DIR}"

  cat > "${DOC_DIR}/install-guide.md" << 'EOF'
# Looper-HQ 安裝架構指南

> 本檔案由 `scripts/install.sh` 自動生成，可視需要手動補充與修改。

## 1. 專案模組分層

- 搜尋爬蟲模組：`services/crawler`
- 後端 API：`services/api`
- 前端 Web：`services/web`
- 公用腳本：`scripts/`

## 2. 安裝步驟概覽

1. 環境檢查（Node.js、Git、資料庫客戶端等）
2. 建立安裝前快照（.env、config、資料庫 schema）
3. 安裝搜尋爬蟲模組依賴
4. 安裝資料庫與管理模組並執行 migration
5. 安裝後端 / 前端依賴
6. 初始化預設頁面與關聯資料

## 3. 一鍵安裝指令

```bash
cd /path/to/Looper-HQ
chmod +x scripts/install.sh
./scripts/install.sh