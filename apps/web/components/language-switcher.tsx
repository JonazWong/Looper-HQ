'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { PremierButton } from '@/components/ui/premier-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'zh', name: '繁體中文', flag: '🇭🇰' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentLanguage = languages.find(lang => lang.code === locale);
  
  const switchLanguage = (newLocale: string) => {
    // Remove current locale prefix and add new locale prefix
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    
    router.push(newPath);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PremierButton variant="ghost" size="sm" icon={<Globe className="h-4 w-4" />}>
          <span className="hidden sm:inline">{currentLanguage?.flag} {currentLanguage?.name}</span>
          <span className="sm:hidden">{currentLanguage?.flag}</span>
        </PremierButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-premier-obsidian border-premier-gold/30">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={`cursor-pointer ${
              locale === language.code 
                ? 'bg-premier-gold/10 text-premier-gold' 
                : 'text-premier-pearl hover:bg-premier-gold/5'
            }`}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
