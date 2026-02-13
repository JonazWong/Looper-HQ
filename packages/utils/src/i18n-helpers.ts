/**
 * i18n Helper Utilities for Bilingual Content
 * Provides utilities to work with localized database fields
 */

export type Locale = 'zh' | 'en';

/**
 * Get localized field value based on locale
 * @param obj - Object containing bilingual fields
 * @param fieldName - Base field name (without _zh or _en suffix)
 * @param locale - Target locale
 * @returns Localized field value or null if not found
 */
export function getLocalizedField<T extends Record<string, any>>(
  obj: T,
  fieldName: string,
  locale: Locale
): string | null {
  const localizedKey = `${fieldName}_${locale}`;
  const fallbackKey = `${fieldName}_zh`; // Fallback to Chinese
  
  // Return localized field if exists and not empty
  if (obj[localizedKey] !== undefined && obj[localizedKey] !== null && obj[localizedKey] !== '') {
    return obj[localizedKey];
  }
  
  // Fallback to Chinese if available
  if (obj[fallbackKey] !== undefined && obj[fallbackKey] !== null && obj[fallbackKey] !== '') {
    return obj[fallbackKey];
  }
  
  return null;
}

/**
 * Case type with bilingual fields
 */
export interface CaseWithBilingualFields {
  title_zh: string;
  title_en: string;
  description_zh: string | null;
  description_en: string | null;
  publicNote_zh: string | null;
  publicNote_en: string | null;
  [key: string]: any;
}

/**
 * Localized case type (flattened for display)
 */
export interface LocalizedCase extends Omit<CaseWithBilingualFields, 'title_zh' | 'title_en' | 'description_zh' | 'description_en' | 'publicNote_zh' | 'publicNote_en'> {
  title: string;
  description: string | null;
  publicNote: string | null;
}

/**
 * Convert a case with bilingual fields to localized version
 * @param caseData - Case with bilingual fields
 * @param locale - Target locale
 * @returns Localized case data
 */
export function localizeCase(caseData: CaseWithBilingualFields, locale: Locale): LocalizedCase {
  const { title_zh, title_en, description_zh, description_en, publicNote_zh, publicNote_en, ...rest } = caseData;
  
  return {
    ...rest,
    title: getLocalizedField(caseData, 'title', locale) || '',
    description: getLocalizedField(caseData, 'description', locale),
    publicNote: getLocalizedField(caseData, 'publicNote', locale),
  };
}

/**
 * PublicCase type with bilingual fields
 */
export interface PublicCaseWithBilingualFields {
  title_zh: string;
  title_en: string;
  description_zh: string | null;
  description_en: string | null;
  judgment_zh: string | null;
  judgment_en: string | null;
  [key: string]: any;
}

/**
 * Localized public case type
 */
export interface LocalizedPublicCase extends Omit<PublicCaseWithBilingualFields, 'title_zh' | 'title_en' | 'description_zh' | 'description_en' | 'judgment_zh' | 'judgment_en'> {
  title: string;
  description: string | null;
  judgment: string | null;
}

/**
 * Convert a public case with bilingual fields to localized version
 * @param publicCase - Public case with bilingual fields
 * @param locale - Target locale
 * @returns Localized public case data
 */
export function localizePublicCase(publicCase: PublicCaseWithBilingualFields, locale: Locale): LocalizedPublicCase {
  const { title_zh, title_en, description_zh, description_en, judgment_zh, judgment_en, ...rest } = publicCase;
  
  return {
    ...rest,
    title: getLocalizedField(publicCase, 'title', locale) || '',
    description: getLocalizedField(publicCase, 'description', locale),
    judgment: getLocalizedField(publicCase, 'judgment', locale),
  };
}

/**
 * CaseNote type with bilingual fields
 */
export interface CaseNoteWithBilingualFields {
  content_zh: string;
  content_en: string;
  [key: string]: any;
}

/**
 * Localized case note type
 */
export interface LocalizedCaseNote extends Omit<CaseNoteWithBilingualFields, 'content_zh' | 'content_en'> {
  content: string;
}

/**
 * Convert a case note with bilingual fields to localized version
 * @param note - Case note with bilingual fields
 * @param locale - Target locale
 * @returns Localized case note data
 */
export function localizeCaseNote(note: CaseNoteWithBilingualFields, locale: Locale): LocalizedCaseNote {
  const { content_zh, content_en, ...rest } = note;
  
  return {
    ...rest,
    content: getLocalizedField(note, 'content', locale) || '',
  };
}
