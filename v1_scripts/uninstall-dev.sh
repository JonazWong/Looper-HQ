#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/uninstall-dev.log}"
BACKUP_DIR="${PROJECT_ROOT}/.install_backups"

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
  scripts/uninstall-dev.sh --rollback-latest    回復到最近一次安裝前快照
  scripts/uninstall-dev.sh --rollback <ID>      回復到指定快照 ID（資料夾名）
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

  # 還原 .env
  if [ -f "${SNAPSHOT_PATH}/.env.bak" ]; then
    cp "${SNAPSHOT_PATH}/.env.bak" "${PROJECT_ROOT}/.env"
    log "已還原 .env"
  fi

  # 可選：還原 docker-compose 檔
  if [ -f "${SNAPSHOT_PATH}/docker-compose.yml.bak" ]; then
    cp "${SNAPSHOT_PATH}/docker-compose.yml.bak" \
      "${PROJECT_ROOT}/infrastructure/docker/docker-compose.yml"
    log "已還原 docker-compose.yml"
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