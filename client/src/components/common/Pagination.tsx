'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

function pageNumbers(current: number, total: number): (number | 'gap')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i)
  const pages: (number | 'gap')[] = [0]
  const winStart = Math.max(1, current - 1)
  const winEnd = Math.min(total - 2, current + 1)
  if (winStart > 1) pages.push('gap')
  for (let i = winStart; i <= winEnd; i++) pages.push(i)
  if (winEnd < total - 2) pages.push('gap')
  pages.push(total - 1)
  return pages
}

export function Pagination({ currentPage, totalPages, totalElements, pageSize, onPageChange, isLoading }: Props) {
  if (totalPages <= 1 && totalElements <= pageSize) return null

  const from = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const to = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div className={`flex items-center justify-between mt-4 flex-wrap gap-3 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {totalElements} results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {pageNumbers(currentPage, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
                p === currentPage
                  ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {p + 1}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="flex items-center gap-1 px-2.5 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
