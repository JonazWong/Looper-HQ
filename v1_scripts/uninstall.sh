#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/.install_backups"
LOG_FILE="${PROJECT_ROOT}/uninstall.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

abort() {
  log "操作失敗：$*"
  exit 1
}

usage() {
  cat << EOF
用法：
  scripts/uninstall.sh --rollback-latest    回復到最近一次安裝前快照
  scripts/uninstall.sh --rollback <ID>      回復到指定快照 ID
EOF
  exit 1
}

get_snapshot_id() {
  local MODE="${1:-}"
  local ID="${2:-}"

  if [ "${MODE}" = "--rollback-latest" ]; then
    if [ ! -f "${BACKUP_DIR}/latest" ]; then
      abort "找不到 latest 快照資訊"
    fi
    cat "${BACKUP_DIR}/latest"
  elif [ "${MODE}" = "--rollback" ]; then
    if [ -z "${ID}" ]; then
      abort "請提供快照 ID"
    fi
    echo "${ID}"
  else
    usage
  fi
}

rollback() {
  local SNAPSHOT_ID="$1"
  local SNAPSHOT_PATH="${BACKUP_DIR}/${SNAPSHOT_ID}"

  if [ ! -d "${SNAPSHOT_PATH}" ]; then
    abort "快照目錄不存在：${SNAPSHOT_PATH}"
  fi

  log "開始回復快照：${SNAPSHOT_ID}"

  # 1. 還原 .env
  if [ -f "${SNAPSHOT_PATH}/.env.bak" ]; then
    cp "${SNAPSHOT_PATH}/.env.bak" "${PROJECT_ROOT}/.env"
    log "已還原 .env"
  fi

  # 2. 還原 config
  if [ -f "${SNAPSHOT_PATH}/config.tar.gz" ]; then
    tar xzf "${SNAPSHOT_PATH}/config.tar.gz" -C "${PROJECT_ROOT}"
    log "已還原 config 目錄"
  fi

  # 3. 視需要還原資料庫 schema（此處僅示範，可依實際情況加上互動提示）
  if [ -f "${SNAPSHOT_PATH}/db_schema.sql" ] && command -v psql >/dev/null 2>&1; then
    if [ -n "${DB_NAME:-}" ] && [ -n "${DB_USER:-}" ]; then
      log "準備還原資料庫 schema 至 ${DB_NAME}（僅結構）"
      psql -U "${DB_USER}" "${DB_NAME}" < "${SNAPSHOT_PATH}/db_schema.sql" || \
        log "警告：資料庫 schema 還原失敗，請手動檢查"
    fi
  fi

  log "回復完成：${SNAPSHOT_ID}"
}

main() {
  if [ "$#" -eq 0 ]; then
    usage
  fi

  local MODE="$1"
  local ID="${2:-}"

  local SNAPSHOT_ID
  SNAPSHOT_ID="$(get_snapshot_id "${MODE}" "${ID}")"

  rollback "${SNAPSHOT_ID}"
}

main "$@"