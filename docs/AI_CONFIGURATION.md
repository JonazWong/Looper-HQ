# Looper-HQ AI 配置完整指南

## 🎯 概述

本文檔說明 Looper-HQ 的統一 AI 配置架構，包括環境變數、程式入口、以及如何與整個系統對齊。

## 📋 目錄

1. [環境變數配置](#環境變數配置)
2. [AI Client 架構](#ai-client-架構)
3. [使用指南](#使用指南)
4. [Provider 切換](#provider-切換)
5. [部署配置](#部署配置)
6. [故障排除](#故障排除)

## 🔧 環境變數配置

### 完整環境變數列表

在 `.env` 或 `.env.production` 中配置：

```bash
# ===========================
# AI Configuration (統一設定)
# ===========================

# AI Provider 基本設定
AI_PROVIDER=openai          # 可選: openai | openrouter | azure | custom
AI_DEFAULT_LOCALE=zh-HK
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.3

# OpenAI / OpenRouter (擇一使用)
OPENAI_API_KEY=sk-...                          # 必填
OPENAI_MODEL=gpt-4o-mini                       # 推薦: gpt-4o-mini (快速) 或 gpt-4o (高品質)
OPENAI_BASE_URL=https://openrouter.ai/api/v1   # OpenRouter 或 https://api.openai.com/v1

# OpenRouter 專用（可選）
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Azure OpenAI（可選）
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_API_KEY=...
# AZURE_OPENAI_DEPLOYMENT=gpt-4
# AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 環境變數說明

| 變數名 | 必填 | 預設值 | 說明 |
|--------|------|--------|------|
| `AI_PROVIDER` | ❌ | `openai` | AI 提供商：openai / openrouter / azure |
| `OPENAI_API_KEY` | ✅ | - | OpenAI 或 OpenRouter API Key |
| `OPENAI_MODEL` | ❌ | `gpt-4o-mini` | 使用的模型名稱 |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | API endpoint |
| `AI_MAX_TOKENS` | ❌ | `2048` | 最大 token 數 |
| `AI_TEMPERATURE` | ❌ | `0.3` | 溫度參數 (0-1) |
| `AI_DEFAULT_LOCALE` | ❌ | `zh-HK` | 預設語言 |

## 🏗️ AI Client 架構

### 統一 AI Client

所有 AI 功能均使用 `@looper-hq/utils/ai-client`：

```typescript
// packages/utils/src/ai-client.ts

import { generateCompletion } from '@looper-hq/utils/ai-client'

// 基本使用
const result = await generateCompletion({
  systemPrompt: '你是專業的法律助手',
  userPrompt: '分析這個案例',
  maxTokens: 1000,
})

// JSON 模式
const structuredData = await generateCompletion({
  systemPrompt: '以 JSON 格式回覆',
  userPrompt: '提取案例信息',
  jsonMode: true,
})

// Streaming
import { generateStreamingCompletion } from '@looper-hq/utils/ai-client'

for await (const chunk of generateStreamingCompletion({
  userPrompt: '長文本生成...',
})) {
  console.log(chunk)
}
```

### 自動 Provider 選擇

Client 會根據 `AI_PROVIDER` 自動配置：

```typescript
// 內部邏輯（簡化）
function createClient() {
  if (provider === 'azure') {
    return new OpenAI({ /* Azure 配置 */ })
  }
  if (provider === 'openrouter') {
    return new OpenAI({ /* OpenRouter 配置 */ })
  }
  // 預設: OpenAI
  return new OpenAI({ /* OpenAI 配置 */ })
}
```

## 📚 使用指南

### 1. 法律案例分類

```typescript
// apps/web/lib/services/ai-classifier.ts

import { generateCompletion } from '@looper-hq/utils/ai-client'

export async function classifyCase(title: string, content: string) {
  const result = await generateCompletion({
    systemPrompt: '你是專業的香港法律案例分析助手。',
    userPrompt: `分析以下案例...\n標題: ${title}\n內容: ${content}`,
    jsonMode: true,
    maxTokens: 1000,
  })
  
  return JSON.parse(result)
}
```

### 2. 法律文件翻譯

```typescript
// apps/web/lib/services/translator.ts

import { generateCompletion } from '@looper-hq/utils/ai-client'

export async function translateText(text: string, direction: 'zh-to-en' | 'en-to-zh') {
  const result = await generateCompletion({
    systemPrompt: '你是專業的香港法律翻譯助手...',
    userPrompt: `請翻譯: ${text}`,
    maxTokens: 2000,
  })
  
  return result
}
```

### 3. API Route 整合

```typescript
// apps/web/app/api/classify/route.ts

import { generateCompletion } from '@looper-hq/utils/ai-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  
  try {
    const result = await generateCompletion({
      systemPrompt: '法律助手系統提示...',
      userPrompt: text,
    })
    
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json({ error: 'AI 處理失敗' }, { status: 500 })
  }
}
```

## 🔄 Provider 切換

### 切換到 OpenRouter

```bash
# .env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet  # 使用 Claude
```

### 切換到 Azure OpenAI

```bash
# .env
AI_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 切換到原生 OpenAI

```bash
# .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

## 🚀 部署配置

### DigitalOcean App Platform

在 `.do/app.yaml` 中已配置所有 AI 環境變數：

```yaml
envs:
  - key: AI_PROVIDER
    value: openai
  - key: OPENAI_API_KEY
    type: SECRET  # 在 DO 控制台填入
  - key: OPENAI_MODEL
    value: gpt-4o-mini
  - key: AI_MAX_TOKENS
    value: "2048"
```

部署時只需在 DigitalOcean 控制台設置 `OPENAI_API_KEY`。

### Vercel

```bash
# 使用 Vercel CLI
vercel env add OPENAI_API_KEY production
vercel env add AI_PROVIDER production
```

### Docker

```dockerfile
# Dockerfile
ENV AI_PROVIDER=openai
ENV OPENAI_MODEL=gpt-4o-mini
# OPENAI_API_KEY 通過 docker run -e 注入
```

## 🔍 故障排除

### 問題 1: `OPENAI_API_KEY not found`

**解決方案**：
```bash
# 檢查環境變數
echo $OPENAI_API_KEY

# 確認 .env 文件存在且正確
cat .env | grep OPENAI

# 重新加載環境變數
source .env  # Linux/Mac
# 或重啟開發服務器
```

### 問題 2: AI 回應格式錯誤

**解決方案**：
```typescript
// 使用 jsonMode 強制 JSON 輸出
const result = await generateCompletion({
  systemPrompt: '請以 JSON 格式回覆',
  userPrompt: '...',
  jsonMode: true,  // ✅ 確保啟用
})
```

### 問題 3: Rate Limit 錯誤

**解決方案**：
```typescript
// 添加重試邏輯
async function generateWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateCompletion(params)
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      throw error
    }
  }
}
```

### 問題 4: Provider 切換後不工作

**解決方案**：
```bash
# 1. 清除舊環境變數
unset OPENAI_API_KEY
unset OPENAI_BASE_URL

# 2. 設置新 provider
export AI_PROVIDER=openrouter
export OPENROUTER_API_KEY=...

# 3. 重啟服務
pnpm dev
```

## 📊 監控和日誌

### 啟用 AI Client 日誌

```typescript
// packages/utils/src/ai-client.ts

// 在 generateCompletion 中添加
console.log('[AI Client] Request:', {
  provider,
  model,
  promptLength: userPrompt.length,
})

console.log('[AI Client] Response:', {
  tokensUsed: response.usage?.total_tokens,
  finishReason: response.choices[0].finish_reason,
})
```

### OpenRouter 使用統計

訪問 [OpenRouter Dashboard](https://openrouter.ai/activity) 查看：
- API 調用次數
- Token 使用量
- 費用統計

## 🎓 最佳實踐

### 1. 系統提示詞優化

```typescript
const LEGAL_SYSTEM_PROMPT = `你是專業的香港法律案例分析助手。

職責：
- 準確分析法律案例
- 提取結構化信息
- 保持法律術語準確性

輸出格式要求：
- 使用繁體中文
- JSON 格式
- 包含信心分數
`
```

### 2. Token 管理

```typescript
// ✅ 限制輸入長度
const truncatedContent = content.substring(0, 2000)

// ✅ 設置合理的 maxTokens
const result = await generateCompletion({
  userPrompt: truncatedContent,
  maxTokens: 1000,  // 避免過長回應
})
```

### 3. 錯誤處理

```typescript
try {
  const result = await generateCompletion(params)
  return result
} catch (error) {
  // 記錄錯誤
  console.error('[AI] Classification failed:', {
    error: error.message,
    params: { ...params, userPrompt: params.userPrompt.substring(0, 100) },
  })
  
  // 返回降級結果
  return { category: 'UNKNOWN', confidence: 0 }
}
```

## 📚 相關文檔

- [AI Client 源碼](../../packages/utils/src/ai-client.ts)
- [DigitalOcean 部署指南](./DIGITALOCEAN_DEPLOYMENT.md)
- [環境變數配置](../../.env.example)
- [OpenRouter 文檔](https://openrouter.ai/docs)
- [OpenAI API 文檔](https://platform.openai.com/docs/api-reference)

## 🎉 快速開始

```bash
# 1. 配置環境變數
cp .env.example .env
# 編輯 .env，填入 OPENAI_API_KEY

# 2. 啟動開發服務器
pnpm dev

# 3. 測試 AI 功能
curl -X POST http://localhost:3005/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"測試","direction":"zh-to-en"}'
```

完成！🚀
