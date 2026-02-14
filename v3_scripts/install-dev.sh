#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/install-dev.log"
BACKUP_DIR="${PROJECT_ROOT}/.install_backups"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

abort() {
  log "安裝失敗：$*"
  log "如需回復，可使用 scripts/uninstall-dev.sh --rollback-latest"
  exit 1
}

create_snapshot() {
  mkdir -p "${BACKUP_DIR}"
  local SNAPSHOT_ID
  SNAPSHOT_ID="$(date '+%Y%m%d-%H%M%S')"
  local SNAPSHOT_PATH="${BACKUP_DIR}/${SNAPSHOT_ID}"
  mkdir -p "${SNAPSHOT_PATH}"

  log "建立安裝前快照：${SNAPSHOT_ID}"

  # 備份 .env
  if [ -f "${PROJECT_ROOT}/.env" ]; then
    cp "${PROJECT_ROOT}/.env" "${SNAPSHOT_PATH}/.env.bak"
  fi

  # 可選：備份 docker compose 檔
  if [ -f "${PROJECT_ROOT}/infrastructure/docker/docker-compose.yml" ]; then
    cp "${PROJECT_ROOT}/infrastructure/docker/docker-compose.yml" \
      "${SNAPSHOT_PATH}/docker-compose.yml.bak"
  fi

  echo "${SNAPSHOT_ID}" > "${BACKUP_DIR}/latest"
}

check_prerequisites() {
  log "檢查系統環境..."

  if ! command -v pnpm >/dev/null 2>&1; then
    abort "未找到 pnpm，請先安裝 pnpm（https://pnpm.io/installation）"
  fi

  if ! command -v docker >/dev/null 2>&1; then
    abort "未找到 docker，請先安裝 Docker Desktop / Docker Engine"
  fi

  log "環境檢查完成。"
}

prepare_env_file() {
  cd "${PROJECT_ROOT}"

  if [ -f ".env" ]; then
    log ".env 已存在，略過從 .env.example 複製"
  else
    if [ -f ".env.example" ]; then
      log "未找到 .env，從 .env.example 自動建立..."
      cp .env.example .env
    else
      log "警告：找不到 .env 與 .env.example，請手動建立環境變數檔案"
    fi
  fi
}

install_dependencies() {
  cd "${PROJECT_ROOT}"
  log "執行 pnpm install..."
  pnpm install
}

start_docker_services() {
  cd "${PROJECT_ROOT}"
  log "啟動 Docker 服務（pnpm docker:up）..."
  pnpm docker:up
}

migrate_database() {
  cd "${PROJECT_ROOT}"
  log "同步資料庫 schema（pnpm db:push）..."
  pnpm db:push
}

seed_database() {
  cd "${PROJECT_ROOT}"
  log "寫入種子資料（pnpm db:seed）..."
  pnpm db:seed
}

bootstrap_data() {
  cd "${PROJECT_ROOT}"
  if pnpm run | grep -q "bootstrap:data"; then
    log "執行初始資料與 AI 設定 bootstrap（pnpm bootstrap:data）..."
    pnpm bootstrap:data
  else
    log "略過 bootstrap:data（尚未定義對應 script）"
  fi
}

main() {
  log "===== Looper-HQ 本機開發環境一鍵安裝開始 ====="

  check_prerequisites
  create_snapshot
  install_dependencies
  prepare_env_file
  start_docker_services
  migrate_database
  seed_database
  bootstrap_data

  log "===== 安裝流程完成 ====="
  log "接下來你可以執行啟動指令："
  log "  pnpm dev:all    # 同時啟動 web + legal-case-search"
  log "或個別啟動："
  log "  pnpm dev:web    # @looper-hq/web  (http://localhost:3000)"
  log "  pnpm dev:legal  # @looper-hq/legal-case-search (http://localhost:3001)"
}

main "$@"