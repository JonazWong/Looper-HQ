'use client';

/**
 * SearchInput with autocomplete dropdown.
 *
 * Fetches typed suggestions from /api/search/suggestions and renders a
 * dropdown beneath the input.  Debounced at 300 ms to avoid excessive
 * API calls.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Suggestion {
  value: string;
  type: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AutocompleteInput({
  value,
  onChange,
  onSubmit,
  placeholder = '輸入搜尋關鍵字…',
  className = '',
  disabled = false,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    try {
      // Fetch case numbers and judge names in parallel
      const [caseRes, judgeRes] = await Promise.all([
        fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}&type=caseNumber&limit=4`),
        fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}&type=judge&limit=4`),
      ]);

      const [caseData, judgeData] = await Promise.all([caseRes.json(), judgeRes.json()]);

      const combined: Suggestion[] = [
        ...(caseData.data?.suggestions ?? []).map((s: string) => ({ value: s, type: 'caseNumber' })),
        ...(judgeData.data?.suggestions ?? []).map((s: string) => ({ value: s, type: 'judge' })),
      ];

      setSuggestions(combined);
      setOpen(combined.length > 0);
      setActiveIdx(-1);
    } catch {
      // Silently ignore suggestion fetch errors
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) {
      if (e.key === 'Enter') onSubmit();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && suggestions[activeIdx]) {
          onChange(suggestions[activeIdx].value);
          setOpen(false);
          setActiveIdx(-1);
        } else {
          setOpen(false);
          onSubmit();
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIdx(-1);
        break;
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    onChange(s.value);
    setOpen(false);
    setActiveIdx(-1);
  };

  const typeLabel: Record<string, string> = {
    caseNumber: '案件編號',
    judge: '法官',
    court: '法院',
    general: '標題',
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-premier-pearl-dark pointer-events-none z-10" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className="pl-10 pr-8 bg-premier-black/40 border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-dark focus:border-premier-gold"
        disabled={disabled}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); setSuggestions([]); setOpen(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-premier-pearl-gray hover:text-premier-pearl"
          aria-label="清除"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border border-premier-gold/20 bg-premier-black-light shadow-premier-lg overflow-hidden"
        >
          {suggestions.map((s, idx) => (
            <li
              key={`${s.type}-${s.value}`}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm transition-colors ${
                idx === activeIdx
                  ? 'bg-premier-gold/20 text-premier-pearl'
                  : 'text-premier-pearl-gray hover:bg-premier-pearl-gray/5'
              }`}
            >
              <span className="truncate">{s.value}</span>
              <span className="ml-2 text-xs text-premier-pearl-dark flex-shrink-0">
                {typeLabel[s.type] ?? s.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
