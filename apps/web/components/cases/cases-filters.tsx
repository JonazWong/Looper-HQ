'use client'

/**
 * CasesFilters - Client Component for Interactive Filters
 * Handles search, status, priority, and category filters
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

interface CasesFiltersProps {
  initialSearch?: string
  initialStatus?: string
  initialPriority?: string
  initialCategory?: string
}

export function CasesFilters({
  initialSearch = '',
  initialStatus = '',
  initialPriority = '',
  initialCategory = '',
}: CasesFiltersProps) {
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

  const hasActiveFilters = initialSearch || initialStatus || initialPriority || initialCategory

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-premier-pearl-gray" />
            <Input
              type="text"
              placeholder="Search by case number, title, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 glass-card border-premier-gold/30"
            />
          </div>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
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
            <DropdownMenuContent align="end" className="glass-card border-premier-gold/30">
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
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PremierButton variant="secondary" size="default" icon={<Filter className="h-4 w-4" />}>
                Priority
                {initialPriority && (
                  <Badge className="ml-2 bg-premier-gold/20 text-premier-gold border-0">
                    1
                  </Badge>
                )}
              </PremierButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-premier-gold/30">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => updateFilters('priority', '')}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('priority', 'URGENT')}>
                Urgent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('priority', 'HIGH')}>
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('priority', 'MEDIUM')}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilters('priority', 'LOW')}>
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            <DropdownMenuContent align="end" className="glass-card border-premier-gold/30">
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
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {initialSearch && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Search: {initialSearch}
            </Badge>
          )}
          {initialStatus && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Status: {initialStatus}
            </Badge>
          )}
          {initialPriority && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Priority: {initialPriority}
            </Badge>
          )}
          {initialCategory && (
            <Badge variant="outline" className="bg-premier-gold/10 text-premier-gold border-premier-gold/30">
              Category: {initialCategory.replace('_', ' ')}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
