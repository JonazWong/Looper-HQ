PRD（產品需求文件）
1. 功能需求
  - 資料收集：法院爬蟲、明報爬蟲 → 存入資料庫

  - 向量索引：text-embedding-3-large → 建立語義索引

  - 分類標註：Legal-BERT / LexNLP → 法案類別、特定字眼、結構化判詞

  - 語言處理：GPT-4 Turbo → 中英文翻譯、摘要、自然語言查詢

  - 輸出層：前端顯示中英文結果、分類標籤、摘要

2. 非功能需求
  - 精準度：法律文本容錯率極低

  - 性能：每日處理數千篇判詞與新聞

  - 安全性：資料庫加密，避免外洩

  - 可擴展性：支援更多新聞來源或法律資料庫

資料庫結構 (ERD)
資料表
- documents：存放原始文本（法院判詞、新聞）

- embeddings：存放向量索引（text-embedding-3-large）

- classifications：存放分類標籤與結構化欄位

- translations：存放中英文翻譯結果

- summaries：存放摘要

ERD 關聯圖
[documents]───< [embeddings]
      │
      ├───< [classifications]
      │
      ├───< [translations]
      │
      └───< [summaries]
