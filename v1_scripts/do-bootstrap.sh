#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "===== DigitalOcean App Platform 自動配置檢查 ====="

# 1. 檢查 .do/app.yaml
if [ ! -f "${PROJECT_ROOT}/.do/app.yaml" ]; then
  echo "❌ 找不到 .do/app.yaml，請先在專案根目錄建立此檔案。"
  exit 1
fi
echo "✅ 已找到 .do/app.yaml"

# 2. 嘗試從 .env.production 或 .env 讀取部份變數（如果存在）
ENV_FILE=""
if [ -f "${PROJECT_ROOT}/.env.production" ]; then
  ENV_FILE="${PROJECT_ROOT}/.env.production"
elif [ -f "${PROJECT_ROOT}/.env" ]; then
  ENV_FILE="${PROJECT_ROOT}/.env"
fi

if [ -n "${ENV_FILE}" ]; then
  echo "✅ 偵測到環境變數檔案：${ENV_FILE}"
  # shellcheck disable=SC2046
  export $(grep -E '^(NEXTAUTH_SECRET|OPENAI_API_KEY|AI_PROVIDER|OPENAI_MODEL)=' "${ENV_FILE}" | xargs -d '\n' -I {} echo {})
else
  echo "⚠️ 未找到 .env.production 或 .env，將以空白值顯示建議變數"
fi

echo
echo "===== 建議在 DigitalOcean App Platform 設定的環境變數 ====="
echo
cat <<EOF
[Web / legal-case-search 服務環境變數]

必填（Secrets）：
- NEXTAUTH_SECRET = ${NEXTAUTH_SECRET:-<請填入安全隨機字串>}
- OPENAI_API_KEY  = ${OPENAI_API_KEY:-<你的 OpenAI 或 OpenRouter API Key>}

建議：
- AI_PROVIDER     = ${AI_PROVIDER:-openai}
- OPENAI_MODEL    = ${OPENAI_MODEL:-gpt-4.1-mini}

其他（視需要）：
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
EOF

echo
if command -v doctl >/dev/null 2>&1; then
  echo "===== 檢測到 doctl，可用以下命令建立 App（請先登入：doctl auth init）====="
  echo
  echo "  doctl apps create --spec .do/app.yaml"
  echo
else
  echo "⚠️ 未偵測到 doctl CLI，如需用命令列管理，可安裝：https://docs.digitalocean.com/reference/doctl/how-to/install/"
fi

echo
echo "✅ 檢查結束：請將上述環境變數填入 DigitalOcean App Platform 對應服務的 Environment Variables。"