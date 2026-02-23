'use client'

/**
 * SearchForm - Client Component for Public Case Search
 */

import * as React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState(initialQuery)

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
            placeholder="Search by case number, title, or keywords..."
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
          Search
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
            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateFilters('category', '')}>
              All Categories
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'CIVIL')}>
              Civil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'CRIMINAL')}>
              Criminal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'CORPORATE')}>
              Corporate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'FAMILY')}>
              Family
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'PROPERTY')}>
              Property
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'EMPLOYMENT')}>
              Employment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'INTELLECTUAL_PROPERTY')}>
              Intellectual Property
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('category', 'OTHER')}>
              Other
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
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateFilters('status', '')}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'ACTIVE')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'PENDING')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'COMPLETED')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'ARCHIVED')}>
              Archived
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFilters('status', 'CANCELLED')}>
              Cancelled
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
            Clear
          </PremierButton>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {initialQuery && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Search: {initialQuery}
            </Badge>
          )}
          {initialCategory && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Category: {initialCategory.replace('_', ' ')}
            </Badge>
          )}
          {initialStatus && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Status: {initialStatus}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
