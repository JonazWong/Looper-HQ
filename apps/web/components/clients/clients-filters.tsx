'use client'

/**
 * ClientsFilters - Client Component for Interactive Filters
 * Handles search and membership tier filters
 */

import * as React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
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

interface ClientsFiltersProps {
  initialSearch?: string
  initialTier?: string
}

export function ClientsFilters({
  initialSearch = '',
  initialTier = '',
}: ClientsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = React.useState(initialSearch)

  const updateFilters = React.useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to page 1 when filters change
    params.set('page', '1')
    
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('search', search)
  }

  const clearFilters = () => {
    setSearch('')
    router.push(pathname)
  }

  const hasActiveFilters = initialSearch || initialTier

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-premier-pearl-gray" />
            <Input
              type="text"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 glass-card border-premier-gold/30"
            />
          </div>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          {/* Membership Tier Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PremierButton variant="secondary" size="default" icon={Filter}>
                Tier
                {initialTier && (
                  <Badge className="ml-2 bg-premier-gold/20 text-premier-gold border-0">
                    1
                  </Badge>
                )}
              </PremierButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-premier-gold/30">
              <DropdownMenuLabel>Filter by Tier</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => updateFilters('tier', '')}>
                All Tiers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('tier', 'BASIC')}>
                Basic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('tier', 'STANDARD')}>
                Standard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('tier', 'PREMIUM')}>
                Premium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('tier', 'PREMIER')}>
                Premier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <PremierButton
              variant="ghost"
              size="default"
              icon={X}
              onClick={clearFilters}
            >
              Clear
            </PremierButton>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {initialSearch && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Search: {initialSearch}
            </Badge>
          )}
          {initialTier && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Tier: {initialTier}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
