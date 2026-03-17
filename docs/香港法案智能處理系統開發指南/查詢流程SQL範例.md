-- 1. 從 embeddings 找到相關文件
SELECT d.id, d.title, d.content
FROM embeddings e
JOIN documents d ON e.document_id = d.id
WHERE cosine_similarity(e.embedding_vector, :query_vector) > 0.8
ORDER BY cosine_similarity(e.embedding_vector, :query_vector) DESC
LIMIT 10;

-- 2. 取得分類、翻譯與摘要
SELECT d.id, d.title, c.category, c.keywords, t.translated_text, s.summary_text
FROM documents d
LEFT JOIN classifications c ON d.id = c.document_id
LEFT JOIN translations t ON d.id = t.document_id
LEFT JOIN summaries s ON d.id = s.document_id
WHERE d.id = :document_id;
