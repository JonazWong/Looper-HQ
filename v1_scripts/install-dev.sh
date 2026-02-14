#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/install.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

abort() {
  log "安裝失敗：$*"
  exit 1
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
  log "寫入測試資料（pnpm db:seed）..."
  pnpm db:seed
}

main() {
  log "===== Looper-HQ 本機開發環境一鍵安裝開始 ====="

  check_prerequisites
  install_dependencies
  prepare_env_file
  start_docker_services
  migrate_database
  seed_database

  log "===== 安裝流程完成 ====="
  log "接下來你可以執行："
  log "  pnpm dev:all    # 同時啟動 web + legal-case-search"
  log "或個別啟動："
  log "  pnpm dev:web    # http://localhost:3000"
  log "  pnpm dev:legal  # http://localhost:3001"
}

main "$@"