'use client'

/**
 * CasesPagination - Client Component for Pagination Controls
 */

import * as React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PremierButton } from '@/components/ui/premier-button'

interface CasesPaginationProps {
  currentPage: number
  totalPages: number
  totalCases: number
  casesPerPage: number
}

export function CasesPagination({
  currentPage,
  totalPages,
  totalCases,
  casesPerPage,
}: CasesPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const startCase = (currentPage - 1) * casesPerPage + 1
  const endCase = Math.min(currentPage * casesPerPage, totalCases)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-premier-gold/20 pt-4">
      <div className="text-sm text-premier-pearl-gray">
        Showing <span className="font-medium text-premier-gold">{startCase}</span> to{' '}
        <span className="font-medium text-premier-gold">{endCase}</span> of{' '}
        <span className="font-medium text-premier-gold">{totalCases}</span> cases
      </div>

      <div className="flex gap-2">
        <PremierButton
          variant="secondary"
          size="sm"
          icon={<ChevronLeft className="h-4 w-4" />}
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </PremierButton>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              // Show first page, last page, current page, and pages around current
              if (page === 1 || page === totalPages) return true
              if (page >= currentPage - 1 && page <= currentPage + 1) return true
              return false
            })
            .map((page, idx, arr) => {
              // Add ellipsis
              const showEllipsisBefore = idx > 0 && arr[idx - 1] !== page - 1
              
              return (
                <React.Fragment key={page}>
                  {showEllipsisBefore && (
                    <span className="px-2 py-1 text-premier-pearl-gray">...</span>
                  )}
                  <PremierButton
                    variant={page === currentPage ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => navigateToPage(page)}
                  >
                    {page}
                  </PremierButton>
                </React.Fragment>
              )
            })}
        </div>

        <PremierButton
          variant="secondary"
          size="sm"
          icon={<ChevronRight className="h-4 w-4" />}
          iconPosition="right"
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </PremierButton>
      </div>
    </div>
  )
}
