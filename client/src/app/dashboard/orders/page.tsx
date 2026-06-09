'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Plus, Search, X } from 'lucide-react'
import { getOrders } from '@/lib/api/orders'
import { Pagination } from '@/components/common/Pagination'
import { PageHeader } from '@/components/common/PageHeader'
import { OrdersTable } from '@/components/pages/orders/OrdersTable'
import type { OrderStatus, OrderSummary } from '@/types/orders'
import type { PagedResponse } from '@/types/common'

const STATUSES: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'FULFILLED']
const PAGE_SIZE = 50

export default function OrdersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get('page') ?? 0))
  const [pagedData, setPagedData] = useState<PagedResponse<OrderSummary> | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>(() => (searchParams.get('status') ?? '') as OrderStatus | '')
  const [searchValue, setSearchValue] = useState(() => searchParams.get('search') ?? '')
  const [activeSearch, setActiveSearch] = useState(() => searchParams.get('search') ?? '')
  const [isLoading, setIsLoading] = useState(true)
  const skipFirstSync = useRef(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getOrders({
      status: statusFilter || undefined,
      clientSearch: activeSearch || undefined,
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

  function handleStatusChange(status: OrderStatus | '') {
    setStatusFilter(status)
    setCurrentPage(0)
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Orders"
        actions={
          <button onClick={() => router.push('/dashboard/orders/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New order</span>
          </button>
        }
      />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by cafe name..."
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
          onChange={e => handleStatusChange(e.target.value as OrderStatus | '')}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <OrdersTable
        orders={pagedData?.content ?? []}
        loading={isLoading}
        onRowClick={id => router.push(`/dashboard/orders/${id}`)}
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
