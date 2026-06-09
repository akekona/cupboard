'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { getInvoices, getInvoiceStats } from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import { KpiRow } from '@/components/common/KpiRow'
import { Pagination } from '@/components/common/Pagination'
import { InvoicesTable } from '@/components/pages/invoices/InvoicesTable'
import type { InvoiceSummary, InvoiceStats, InvoiceStatus } from '@/types/invoices'
import type { PagedResponse } from '@/types/common'

const STATUSES: InvoiceStatus[] = ['DRAFT', 'FINALIZED', 'SENT', 'PAID', 'OVERDUE', 'REFUNDED']
const PAGE_SIZE = 50

export default function InvoicesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get('page') ?? 0))
  const [pagedData, setPagedData] = useState<PagedResponse<InvoiceSummary> | null>(null)
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>(() => (searchParams.get('status') ?? '') as InvoiceStatus | '')
  const [searchValue, setSearchValue] = useState(() => searchParams.get('search') ?? '')
  const [activeSearch, setActiveSearch] = useState(() => searchParams.get('search') ?? '')
  const [isLoading, setIsLoading] = useState(true)
  const skipFirstSync = useRef(true)

  useEffect(() => {
    getInvoiceStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getInvoices({
      status: statusFilter || undefined,
      search: activeSearch || undefined,
      page: currentPage,
      size: PAGE_SIZE,
    })
      .then(data => { if (!cancelled) setPagedData(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [currentPage, statusFilter, activeSearch])

  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (activeSearch) params.set('search', activeSearch)
    if (currentPage > 0) params.set('page', String(currentPage))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [statusFilter, activeSearch, currentPage])

  function handleSearch() {
    setActiveSearch(searchValue)
    setCurrentPage(0)
  }

  function handleClearSearch() {
    setSearchValue('')
    setActiveSearch('')
    setCurrentPage(0)
  }

  function handleStatusChange(status: InvoiceStatus | '') {
    setStatusFilter(status)
    setCurrentPage(0)
  }

  return (
    <div className="page-container">
      <h1 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">Invoices</h1>

      <KpiRow cards={[
        { label: 'Total outstanding', value: stats ? formatCurrency(stats.totalOutstanding, 'USD') : '—', valueClassName: stats && stats.totalOutstanding > 0 ? 'text-amber-600' : undefined },
        { label: 'Overdue',           value: stats ? formatCurrency(stats.totalOverdue, 'USD') : '—',      subtext: stats ? `${stats.overdueCount} invoice${stats.overdueCount !== 1 ? 's' : ''} overdue` : undefined, valueClassName: stats && stats.totalOverdue > 0 ? 'text-red-600' : undefined },
        { label: 'Paid this month',   value: stats ? formatCurrency(stats.totalPaidThisMonth, 'USD') : '—', valueClassName: 'text-green-600' },
      ]} />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by invoice number or client…"
            className="w-full pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
          />
          {searchValue && (
            <button onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20 flex items-center justify-center">
              <X size={10} />
            </button>
          )}
        </div>
        <button onClick={handleSearch}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-md hover:bg-[#2f5a0e] transition-colors whitespace-nowrap">
          Search
        </button>
        <select
          value={statusFilter}
          onChange={e => handleStatusChange(e.target.value as InvoiceStatus | '')}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <InvoicesTable
        invoices={pagedData?.content ?? []}
        loading={isLoading}
        onRowClick={id => router.push(`/dashboard/invoices/${id}`)}
        onOrderClick={id => router.push(`/dashboard/orders/${id}`)}
      />

      {pagedData && pagedData.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagedData.totalPages}
          totalElements={pagedData.totalElements}
          pageSize={pagedData.pageSize}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
