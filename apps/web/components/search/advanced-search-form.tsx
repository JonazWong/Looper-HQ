'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PremierButton } from '@/components/ui/premier-button';
import { Badge } from '@/components/ui/badge';

export function AdvancedSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<Array<{ query: string; count: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Fetch search suggestions with debounce
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data.suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    }, 300); // Debounce 300ms
    
    return () => clearTimeout(timer);
  }, [query]);
  
  // Fetch trending searches on mount
  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch('/api/search/trending');
        const data = await response.json();
        if (data.success) {
          setTrending(data.data.trending);
        }
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      }
    }
    fetchTrending();
  }, []);
  
  const handleSearch = (searchQuery: string) => {
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&mode=fulltext`);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Search Box */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-premier-pearl-gray" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="搜索法律案例、案號、關鍵詞..."
            className="pl-10 pr-24 h-12 bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl"
          />
          <PremierButton
            type="submit"
            variant="primary"
            size="sm"
            icon={<Search className="h-4 w-4" />}
            disabled={!query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            搜索
          </PremierButton>
        </div>
        
        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-premier-obsidian border border-premier-gold/30 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                }}
                className="w-full px-4 py-3 text-left hover:bg-premier-gold/10 text-premier-pearl transition-colors"
              >
                <Search className="inline h-4 w-4 mr-2 text-premier-gold" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>
      
      {/* Trending Searches */}
      {trending.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <TrendingUp className="h-4 w-4 text-premier-gold" />
          <span className="text-sm text-premier-pearl-gray">熱門搜索:</span>
          {trending.slice(0, 5).map((item, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-premier-gold/20 border-premier-gold/30 text-premier-pearl"
              onClick={() => handleSearch(item.query)}
            >
              {item.query} ({item.count})
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
