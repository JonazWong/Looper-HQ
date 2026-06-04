'use client'

/**
 * SearchForm - Client Component for Public Case Search
 */

import * as React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Filter, X, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PremierButton } from '@/components/ui/premier-button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface SearchFormProps {
  initialQuery?: string
  initialCategory?: string
  initialStatus?: string
}

export function SearchForm({
  initialQuery = '',
  initialCategory = '',
  initialStatus = '',
}: SearchFormProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState(initialQuery)

  const categoryLabels: Record<string, string> = {
    CIVIL: t('case.categories.CIVIL'),
    CRIMINAL: t('case.categories.CRIMINAL'),
    CORPORATE: t('case.categories.CORPORATE'),
    FAMILY: t('case.categories.FAMILY'),
    PROPERTY: t('case.categories.PROPERTY'),
    EMPLOYMENT: t('case.categories.EMPLOYMENT'),
    INTELLECTUAL_PROPERTY: t('case.categories.INTELLECTUAL_PROPERTY'),
    OTHER: t('case.categories.OTHER'),
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: t('case.statuses.ACTIVE'),
    PENDING: t('case.statuses.PENDING'),
    COMPLETED: t('case.statuses.COMPLETED'),
    ARCHIVED: t('case.statuses.ARCHIVED'),
    CANCELLED: t('case.statuses.CANCELLED'),
  }

  const updateFilters = React.useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('q', query)
  }

  const clearFilters = () => {
    setQuery('')
    router.push(pathname)
  }

  const hasActiveFilters = initialQuery || initialCategory || initialStatus

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-premier-pearl-gray" />
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-12 text-base glass-card border-premier-gold/30 text-premier-pearl placeholder:text-premier-pearl-gray"
          />
        </div>
        <PremierButton 
          type="submit" 
          variant="primary" 
          size="lg"
          icon={<Search className="h-4 w-4" />}
        >
          {t('common.search')}
        </PremierButton>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <PremierButton variant="secondary" size="default" icon={<Filter className="h-4 w-4" />}>
              Category
              {initialCategory && (
                <Badge className="ml-2 bg-premier-gold/20 text-premier-gold border-0">
                  1
                </Badge>
              )}
            </PremierButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="glass-card border-premier-gold/30">
            <DropdownMenuLabel>{t('search.filters.category')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateFilters('category', '')}>
              {t('search.filters.allCategories')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'CIVIL')}>
              {categoryLabels.CIVIL}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'CRIMINAL')}>
              {categoryLabels.CRIMINAL}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'CORPORATE')}>
              {categoryLabels.CORPORATE}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'FAMILY')}>
              {categoryLabels.FAMILY}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'PROPERTY')}>
              {categoryLabels.PROPERTY}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'EMPLOYMENT')}>
              {categoryLabels.EMPLOYMENT}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'INTELLECTUAL_PROPERTY')}>
              {categoryLabels.INTELLECTUAL_PROPERTY}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'OTHER')}>
              {categoryLabels.OTHER}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <PremierButton variant="secondary" size="default" icon={<Filter className="h-4 w-4" />}>
              Status
              {initialStatus && (
                <Badge className="ml-2 bg-premier-gold/20 text-premier-gold border-0">
                  1
                </Badge>
              )}
            </PremierButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="glass-card border-premier-gold/30">
            <DropdownMenuLabel>{t('case.status')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateFilters('status', '')}>
              {t('search.filters.allStatuses')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'ACTIVE')}>
              {statusLabels.ACTIVE}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'PENDING')}>
              {statusLabels.PENDING}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'COMPLETED')}>
              {statusLabels.COMPLETED}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'ARCHIVED')}>
              {statusLabels.ARCHIVED}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'CANCELLED')}>
              {statusLabels.CANCELLED}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <PremierButton
            variant="ghost"
            size="default"
            icon={<X className="h-4 w-4" />}
            onClick={clearFilters}
          >
            {t('common.reset')}
          </PremierButton>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {initialQuery && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              {t('common.search')}: {initialQuery}
            </Badge>
          )}
          {initialCategory && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              {t('case.category')}: {categoryLabels[initialCategory] ?? initialCategory.replace('_', ' ')}
            </Badge>
          )}
          {initialStatus && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              {t('case.status')}: {statusLabels[initialStatus] ?? initialStatus}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
