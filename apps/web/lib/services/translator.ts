import OpenAI from 'openai';

export type TranslationDirection = 'zh-to-en' | 'en-to-zh';

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isLegalContext: boolean;
}

/**
 * AI 翻譯服務 - 專注法律術語準確性
 * AI Translation Service - Focus on legal terminology accuracy
 */
export async function translateText(
  text: string,
  direction: TranslationDirection,
  context: 'legal' | 'general' = 'legal'
): Promise<TranslationResult> {
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  const [sourceLang, targetLang] = direction === 'zh-to-en' 
    ? ['繁體中文', 'English']
    : ['English', '繁體中文'];
  
  const systemPrompt = context === 'legal'
    ? `你是專業的香港法律翻譯助手。請準確翻譯法律文件，保持專業術語的準確性。
       - 保留案號格式 (如: HCAL 123/2024)
       - 準確翻譯法院名稱 (如: High Court → 高等法院)
       - 保持法律術語專業性
       - 香港法律用語優先`
    : '你是專業翻譯助手，提供準確流暢的翻譯。';
  
  const userPrompt = `請將以下${sourceLang}文本翻譯為${targetLang}:\n\n${text}`;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    const translatedText = response.choices[0].message.content || text;
    
    return {
      originalText: text,
      translatedText: translatedText.trim(),
      sourceLang,
      targetLang,
      isLegalContext: context === 'legal',
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed');
  }
}

/**
 * 批量翻譯
 * Batch translation
 */
export async function batchTranslate(
  texts: string[],
  direction: TranslationDirection
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];
  
  for (const text of texts) {
    try {
      const result = await translateText(text, direction);
      results.push(result);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to translate: ${text}`, error);
      results.push({
        originalText: text,
        translatedText: text, // Fallback to original
        sourceLang: direction === 'zh-to-en' ? '繁體中文' : 'English',
        targetLang: direction === 'zh-to-en' ? 'English' : '繁體中文',
        isLegalContext: false,
      });
    }
  }
  
  return results;
}

/**
 * 自動偵測語言並翻譯
 * Auto-detect language and translate
 */
export async function autoTranslate(text: string): Promise<TranslationResult> {
  // 簡單語言檢測（檢查是否包含中文字符）
  // Simple language detection (check for Chinese characters)
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const direction: TranslationDirection = hasChinese ? 'zh-to-en' : 'en-to-zh';
  
  return translateText(text, direction);
}
