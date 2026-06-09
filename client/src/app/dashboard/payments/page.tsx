'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { getPayments, getPaymentStats } from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import { KpiRow } from '@/components/common/KpiRow'
import { Pagination } from '@/components/common/Pagination'
import { PaymentSearchRow } from '@/components/pages/payments/PaymentSearchRow'
import { PaymentsTable } from '@/components/pages/payments/PaymentsTable'
import type { Payment, PaymentStats, PaymentStatus, PaymentMethod } from '@/types/invoices'
import type { PagedResponse } from '@/types/common'

const PAGE_SIZE = 50

export default function PaymentsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const skipFirstSync = useRef(true)

  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get('page') ?? 0))
  const [pagedData, setPagedData] = useState<PagedResponse<Payment> | null>(null)
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>(() => (searchParams.get('status') ?? '') as PaymentStatus | '')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>(() => (searchParams.get('method') ?? '') as PaymentMethod | '')
  const [searchValue, setSearchValue] = useState(() => searchParams.get('search') ?? '')
  const [activeSearch, setActiveSearch] = useState(() => searchParams.get('search') ?? '')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getPaymentStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getPayments({
      status: statusFilter || undefined,
      paymentMethod: methodFilter || undefined,
      search: activeSearch || undefined,
      page: currentPage,
      size: PAGE_SIZE,
    })
      .then(data => { if (!cancelled) setPagedData(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [statusFilter, methodFilter, activeSearch, currentPage])

  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    const params = new URLSearchParams()
    if (activeSearch) params.set('search', activeSearch)
    if (statusFilter) params.set('status', statusFilter)
    if (methodFilter) params.set('method', methodFilter)
    if (currentPage > 0) params.set('page', String(currentPage))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [activeSearch, statusFilter, methodFilter, currentPage])

  function handleSearchSubmit() {
    setActiveSearch(searchValue)
    setCurrentPage(0)
  }

  function handleClearSearch() {
    setSearchValue('')
    setActiveSearch('')
    setCurrentPage(0)
  }

  function handleStatusChange(status: PaymentStatus | '') {
    setStatusFilter(status)
    setCurrentPage(0)
  }

  function handleMethodChange(method: PaymentMethod | '') {
    setMethodFilter(method)
    setCurrentPage(0)
  }

  return (
    <div className="page-container">
      <h1 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">Payments</h1>

      <KpiRow cards={[
        { label: 'Collected this month', value: stats ? formatCurrency(stats.collectedThisMonth, 'USD') : '—', valueClassName: 'text-green-600' },
        { label: 'Pending',  value: stats ? formatCurrency(stats.pending, 'USD') : '—' },
        { label: 'Refunded', value: stats ? formatCurrency(stats.refunded, 'USD') : '—', valueClassName: stats && stats.refunded > 0 ? 'text-red-600' : undefined },
      ]} />

      <PaymentSearchRow
        searchValue={searchValue}
        activeSearch={activeSearch}
        statusFilter={statusFilter}
        methodFilter={methodFilter}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        onStatusChange={handleStatusChange}
        onMethodChange={handleMethodChange}
      />

      <PaymentsTable
        payments={pagedData?.content ?? []}
        loading={isLoading}
        onInvoiceClick={id => router.push(`/dashboard/invoices/${id}`)}
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

      <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
        <span>All Stripe transactions processed in test mode</span>
        <span>·</span>
        <a href="https://dashboard.stripe.com/test/payments" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-0.5 hover:text-gray-600 transition-colors">
          View Stripe dashboard<ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
