'use client';

import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { PremierButton } from '@/components/ui/premier-button';

interface TranslateButtonProps {
  text: string;
  onTranslated?: (translatedText: string) => void;
  className?: string;
}

export function TranslateButton({ text, onTranslated, className }: TranslateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleTranslate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, direction: 'auto' }),
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const result = await response.json();
      const translatedText = result.data.translatedText;
      
      setTranslated(translatedText);
      onTranslated?.(translatedText);
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={className}>
      <PremierButton
        variant="ghost"
        size="sm"
        icon={loading ? Loader2 : Languages}
        onClick={handleTranslate}
        disabled={loading}
        className={loading ? 'animate-pulse' : ''}
      >
        {loading ? 'Translating...' : 'Translate'}
      </PremierButton>
      
      {translated && (
        <div className="mt-2 p-3 bg-premier-gold/10 border border-premier-gold/30 rounded-lg">
          <p className="text-sm text-premier-pearl">{translated}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
