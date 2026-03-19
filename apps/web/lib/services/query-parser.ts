/**
 * Advanced Query Syntax Parser
 *
 * Supports:
 *  - Field filters: court:CFI, year:2024, judge:"John Smith", category:criminal
 *  - Supported fields: court, year, category, judge, source, caseNumber
 *  - Quoted phrases: "quoted phrase" (treated as a single token)
 *  - Implicit AND between tokens
 *  - Explicit AND / OR / NOT (normalised; OR/NOT kept as annotations)
 *  - Mixed mode: court:CFI 刑事 theft
 *
 * Output:
 *  {
 *    freeText: string,        // remaining keywords/phrases not consumed by field filters
 *    filters: {
 *      court?:      string[],
 *      year?:       number[],
 *      category?:   string[],
 *      judge?:      string[],
 *      source?:     string[],
 *      caseNumber?: string[],
 *    },
 *    errors: string[],        // non-fatal parse warnings
 *  }
 */

export interface ParsedQuery {
  freeText: string;
  filters: {
    court?: string[];
    year?: number[];
    category?: string[];
    judge?: string[];
    source?: string[];
    caseNumber?: string[];
  };
  errors: string[];
}

const FIELD_NAMES = ['court', 'year', 'category', 'judge', 'source', 'casenumber'] as const;
type FieldName = (typeof FIELD_NAMES)[number];

/** Canonical map: lowercase input key → typed key. */
const FIELD_ALIAS: Record<string, FieldName> = {
  court: 'court',
  year: 'year',
  category: 'category',
  judge: 'judge',
  source: 'source',
  casenumber: 'casenumber',
  case_number: 'casenumber',
  'case-number': 'casenumber',
};

type Token =
  | { kind: 'field'; field: FieldName; value: string }
  | { kind: 'text'; value: string }
  | { kind: 'op'; value: 'AND' | 'OR' | 'NOT' };

/**
 * Tokenise the raw query string into a flat list of tokens.
 * Handles:
 *  - field:value  and  field:"quoted value"
 *  - "quoted phrases"
 *  - bare words
 *  - AND / OR / NOT keywords
 */
function tokenise(input: string): Token[] {
  const tokens: Token[] = [];
  // Working index into input
  let i = 0;

  const skipWS = () => {
    while (i < input.length && /\s/.test(input[i])) i++;
  };

  /** Read a quoted string starting at the current `i` (which points at `"`). */
  const readQuoted = (): string => {
    i++; // skip opening quote
    let result = '';
    while (i < input.length && input[i] !== '"') {
      result += input[i++];
    }
    if (i < input.length) i++; // skip closing quote
    return result;
  };

  /** Read a bare word (no spaces, no quotes, no colon at start). */
  const readBareWord = (): string => {
    let result = '';
    while (i < input.length && !/[\s":]/.test(input[i])) {
      result += input[i++];
    }
    return result;
  };

  while (i < input.length) {
    skipWS();
    if (i >= input.length) break;

    const ch = input[i];

    if (ch === '"') {
      // Quoted phrase → free text token
      const phrase = readQuoted();
      if (phrase) tokens.push({ kind: 'text', value: phrase });
      continue;
    }

    // Read a bare word; check if it's followed by ':' (field filter)
    const word = readBareWord();
    if (!word) {
      // Shouldn't happen but advance to avoid infinite loop
      i++;
      continue;
    }

    // Peek ahead: is the very next char a colon?
    if (i < input.length && input[i] === ':') {
      i++; // skip ':'
      // Check if this word is a recognised field
      const fieldKey = FIELD_ALIAS[word.toLowerCase()];
      if (fieldKey) {
        // Read field value: quoted or bare
        let value: string;
        if (i < input.length && input[i] === '"') {
          value = readQuoted();
        } else {
          value = readBareWord();
        }
        tokens.push({ kind: 'field', field: fieldKey, value });
      } else {
        // Unknown field — treat "word:value" as free text
        let value: string;
        if (i < input.length && input[i] === '"') {
          value = readQuoted();
        } else {
          value = readBareWord();
        }
        tokens.push({ kind: 'text', value: `${word}:${value}` });
      }
      continue;
    }

    // Check if the bare word is a boolean operator
    const upper = word.toUpperCase();
    if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
      tokens.push({ kind: 'op', value: upper as 'AND' | 'OR' | 'NOT' });
    } else {
      tokens.push({ kind: 'text', value: word });
    }
  }

  return tokens;
}

/**
 * Parse a raw query string into structured filters + free-text remainder.
 *
 * @param input  Raw query string entered by the user.
 * @returns      ParsedQuery with extracted filters and remaining free text.
 */
export function parseQuery(input: string): ParsedQuery {
  const errors: string[] = [];

  if (!input || !input.trim()) {
    return { freeText: '', filters: {}, errors };
  }

  const tokens = tokenise(input.trim());

  const filters: ParsedQuery['filters'] = {};
  const freeTextParts: string[] = [];

  for (const token of tokens) {
    if (token.kind === 'op') {
      // Operators (AND/OR/NOT) are contextual — we don't generate free text for them
      continue;
    }

    if (token.kind === 'field') {
      const { field, value } = token;

      if (!value) {
        errors.push(`Field "${field}" has no value`);
        continue;
      }

      switch (field) {
        case 'year': {
          const num = parseInt(value, 10);
          if (isNaN(num) || num < 1800 || num > 2100) {
            errors.push(`Invalid year value: "${value}"`);
          } else {
            filters.year = [...(filters.year ?? []), num];
          }
          break;
        }
        case 'court':
          filters.court = [...(filters.court ?? []), value];
          break;
        case 'category':
          filters.category = [...(filters.category ?? []), value];
          break;
        case 'judge':
          filters.judge = [...(filters.judge ?? []), value];
          break;
        case 'source':
          filters.source = [...(filters.source ?? []), value];
          break;
        case 'casenumber':
          filters.caseNumber = [...(filters.caseNumber ?? []), value];
          break;
      }
      continue;
    }

    // Free-text token
    if (token.value.trim()) {
      freeTextParts.push(token.value.trim());
    }
  }

  return {
    freeText: freeTextParts.join(' '),
    filters,
    errors,
  };
}
