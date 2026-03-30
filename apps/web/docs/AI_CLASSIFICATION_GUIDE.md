# AI 智能案例分類系統使用指南

## 概述

AI 智能案例分類系統使用 OpenAI 或 OpenRouter API 自動分析香港法律案例，提取結構化信息，包括案例類別、法院、法官、當事人、判決日期等。

## 環境設置

### 1. 配置環境變數

在 `.env.local` 文件中添加以下配置：

```bash
# OpenAI API 配置
OPENAI_API_KEY=your-api-key-here

# 使用 OpenAI 官方 API
OPENAI_MODEL=gpt-5.1
# 或使用 OpenRouter (推薦，成本更低)
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet
```

### 2. OpenRouter 配置 (推薦)

OpenRouter 提供更多模型選擇和更低成本：

1. 訪問 https://openrouter.ai/
2. 註冊並獲取 API 密鑰
3. 設置環境變數：
   ```bash
   OPENAI_API_KEY=sk-or-v1-xxxxx
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_MODEL=anthropic/claude-3.5-sonnet
   ```

## 後端使用

### API 路由

使用 `/api/classify` 端點進行案例分類：

```typescript
// POST /api/classify
const response = await fetch('/api/classify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 需要身份驗證
  },
  body: JSON.stringify({
    title: '香港特別行政區 訴 張三',
    content: '本案涉及一起盜竊罪的刑事訴訟...'
  })
});

const result = await response.json();
// {
//   category: 'CRIMINAL',
//   court: '區域法院',
//   judge: '李法官',
//   parties: ['香港特別行政區', '張三'],
//   judgmentDate: '2024-01-15T00:00:00.000Z',
//   summary: '刑事盜竊案件，被告被判處有期徒刑',
//   confidence: 0.95,
//   keywords: ['刑事', '盜竊', '有期徒刑']
// }
```

### 直接使用服務

```typescript
import { classifyCase } from '@/lib/services/ai-classifier';

const result = await classifyCase(
  '民事訴訟案例',
  '原告與被告因合同糾紛產生爭議...'
);

console.log(result.category);    // 'CIVIL'
console.log(result.confidence);  // 0.95
console.log(result.court);       // '香港高等法院'
```

## 前端使用

### AIClassifyButton 組件

在案例詳情頁面使用 AI 分類按鈕：

```tsx
import { AIClassifyButton } from '@/components/case/ai-classify-button';

function CaseDetailPage({ case }) {
  const handleClassified = (result) => {
    console.log('分類結果:', result);
    // 可以在這裡更新案例資訊
  };

  return (
    <div>
      <h1>{case.title}</h1>
      <AIClassifyButton
        caseId={case.id}
        title={case.title}
        content={case.description}
        onClassified={handleClassified}
      />
    </div>
  );
}
```

### Toast 通知系統

需要在應用的根組件包裹 ToastProvider：

```tsx
import { ToastProvider } from '@/hooks/use-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

## 支持的案例類別

系統支持以下案例類別：

- `CIVIL` - 民事
- `CRIMINAL` - 刑事
- `CRIMINAL_APPEAL` - 刑事上訴
- `CORPORATE` - 公司
- `FAMILY` - 家事
- `PROPERTY` - 物業
- `EMPLOYMENT` - 勞工
- `INTELLECTUAL_PROPERTY` - 知識產權
- `OTHER` - 其他

## 分類結果字段

```typescript
interface ClassificationResult {
  category: CaseCategory;      // 案例類別
  court: string | null;        // 法院名稱
  judge: string | null;        // 法官姓名
  parties: string[];           // 當事人列表
  judgmentDate: Date | null;   // 判決日期
  summary: string;             // 案例摘要
  confidence: number;          // 信心度 (0-1)
  keywords: string[];          // 關鍵詞列表
}
```

## 最佳實踐

1. **內容長度**: 系統會自動截取前 2000 字符進行分析，確保最重要的信息在開頭
2. **錯誤處理**: 始終處理可能的 API 錯誤和超時
3. **信心度**: 信心度 < 0.7 的結果建議人工審核
4. **成本優化**: 使用 OpenRouter 可以降低 API 成本
5. **批量處理**: 避免短時間內大量調用，注意 API 速率限制

## 故障排除

### API 密鑰錯誤
```
Error: OPENAI_API_KEY environment variable is required for AI classification
```
確保在 `.env.local` 中設置了正確的 API 密鑰。

### JSON 解析錯誤
```
Error: Failed to parse AI classification response: invalid JSON format
```
AI 響應格式異常，可能是模型問題。嘗試切換不同的模型。

### 身份驗證失敗
```
{ error: 'Unauthorized' }
```
確保用戶已登錄並有有效的會話。

## 測試

運行測試套件：

```bash
npm test -- __tests__/lib/ai-classifier.test.ts
npm test -- __tests__/api/classify.test.ts
```

## 性能指標

- **響應時間**: 通常 2-5 秒
- **準確率**: > 90%
- **成本**: 
  - OpenAI GPT-5.1 (當前使用): 定價待更新
  - OpenAI GPT-4o-mini: ~$0.0001/請求
  - OpenRouter Claude 3.5 Sonnet: ~$0.00005/請求
