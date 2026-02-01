'use client'

/**
 * ClientsPagination - Client Component for Pagination Controls
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PremierButton } from '@/components/ui/premier-button'

interface ClientsPaginationProps {
  currentPage: number
  totalPages: number
}

export function ClientsPagination({ currentPage, totalPages }: ClientsPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-premier-pearl-gray">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <PremierButton
          variant="secondary"
          size="default"
          icon={ChevronLeft}
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </PremierButton>
        <PremierButton
          variant="secondary"
          size="default"
          iconPosition="right"
          icon={ChevronRight}
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </PremierButton>
      </div>
    </div>
  )
}
