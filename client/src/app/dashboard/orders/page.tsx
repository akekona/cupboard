'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getOrders } from '@/lib/api/orders'
import { getUsers } from '@/lib/api/users'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { Pagination } from '@/components/common/Pagination'
import { PageHeader } from '@/components/common/PageHeader'
import { OrderStatusTabs } from '@/components/pages/orders/OrderStatusTabs'
import { OrderSearchRow } from '@/components/pages/orders/OrderSearchRow'
import { OrdersTable } from '@/components/pages/orders/OrdersTable'
import type { OrderStatus, OrderSortBy, SortDir, OrderSummary } from '@/types/orders'
import type { User } from '@/types/users'
import type { PagedResponse } from '@/types/common'

const PAGE_SIZE = 50

const EMPTY_MESSAGES: Record<OrderStatus | 'ALL', string> = {
  ALL: 'No orders found.',
  DRAFT: 'No draft orders.',
  CONFIRMED: 'No confirmed orders.',
  SHIPPED: 'No shipped orders.',
  FULFILLED: 'No fulfilled orders.',
}

export default function OrdersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [admin, setAdmin] = useState(false)
  const skipFirstSync = useRef(true)

  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>(
    () => (searchParams.get('tab') ?? 'ALL') as OrderStatus | 'ALL'
  )
  const [clientSearchInput, setClientSearchInput] = useState(() => searchParams.get('clientSearch') ?? '')
  const [activeClientSearch, setActiveClientSearch] = useState(() => searchParams.get('clientSearch') ?? '')
  const [orderNumberInput, setOrderNumberInput] = useState(() => searchParams.get('orderNumber') ?? '')
  const [activeOrderNumber, setActiveOrderNumber] = useState(() => searchParams.get('orderNumber') ?? '')
  const [createdByFilter, setCreatedByFilter] = useState<number | null>(() => {
    const v = searchParams.get('createdBy'); return v ? Number(v) : null
  })
  const [sortBy, setSortBy] = useState<OrderSortBy>(
    () => (searchParams.get('sortBy') as OrderSortBy) ?? 'createdAt'
  )
  const [sortDir, setSortDir] = useState<SortDir>(
    () => (searchParams.get('sortDir') as SortDir) ?? 'desc'
  )
  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get('page') ?? 0))
  const [pagedData, setPagedData] = useState<PagedResponse<OrderSummary> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  // Fetch users once on mount (admin only)
  useEffect(() => {
    const a = isAdmin(getAuthUser() ?? { roles: [] } as never)
    setAdmin(a)
    if (!a) return
    getUsers().then(setUsers).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch orders whenever any filter/sort/page changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getOrders({
      status: activeTab !== 'ALL' ? activeTab : undefined,
      clientSearch: activeClientSearch || undefined,
      orderNumber: activeOrderNumber || undefined,
      createdById: createdByFilter ?? undefined,
      sortBy,
      sortDir,
      page: currentPage,
      size: PAGE_SIZE,
    })
      .then(data => { if (!cancelled) setPagedData(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [activeTab, activeClientSearch, activeOrderNumber, createdByFilter, sortBy, sortDir, currentPage])

  // Sync filter state to URL
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    const params = new URLSearchParams()
    if (activeTab !== 'ALL') params.set('tab', activeTab)
    if (activeClientSearch) params.set('clientSearch', activeClientSearch)
    if (activeOrderNumber) params.set('orderNumber', activeOrderNumber)
    if (createdByFilter) params.set('createdBy', String(createdByFilter))
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (sortDir !== 'desc') params.set('sortDir', sortDir)
    if (currentPage > 0) params.set('page', String(currentPage))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [activeTab, activeClientSearch, activeOrderNumber, createdByFilter, sortBy, sortDir, currentPage])

  function handleTabChange(tab: OrderStatus | 'ALL') {
    setActiveTab(tab)
    setCurrentPage(0)
  }

  function handleClientSearch() {
    setActiveClientSearch(clientSearchInput)
    setCurrentPage(0)
  }

  function handleOrderNumberSearch() {
    setActiveOrderNumber(orderNumberInput)
    setCurrentPage(0)
  }

  function handleClearClientSearch() {
    setClientSearchInput('')
    setActiveClientSearch('')
    setCurrentPage(0)
  }

  function handleClearOrderNumber() {
    setOrderNumberInput('')
    setActiveOrderNumber('')
    setCurrentPage(0)
  }

  function handleCreatedByChange(userId: number | null) {
    setCreatedByFilter(userId)
    setCurrentPage(0)
  }

  function handleSortChange(field: OrderSortBy, dir: SortDir) {
    setSortBy(field)
    setSortDir(dir)
    setCurrentPage(0)
  }

  function handleTableSort(field: OrderSortBy) {
    const newDir = sortBy === field
      ? (sortDir === 'asc' ? 'desc' : 'asc')
      : (field === 'needBy' ? 'asc' : 'desc')
    handleSortChange(field, newDir)
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

      <OrderStatusTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        totalElements={pagedData?.totalElements ?? 0}
      />

      <OrderSearchRow
        orderNumberInput={orderNumberInput}
        clientSearchInput={clientSearchInput}
        createdByFilter={createdByFilter}
        sortBy={sortBy}
        sortDir={sortDir}
        users={users}
        isAdmin={admin}
        onOrderNumberChange={setOrderNumberInput}
        onClientSearchChange={setClientSearchInput}
        onOrderNumberSearch={handleOrderNumberSearch}
        onClientSearch={handleClientSearch}
        onClearOrderNumber={handleClearOrderNumber}
        onClearClientSearch={handleClearClientSearch}
        onCreatedByChange={handleCreatedByChange}
        onSortChange={handleSortChange}
      />

      <OrdersTable
        orders={pagedData?.content ?? []}
        loading={isLoading}
        onRowClick={id => router.push(`/dashboard/orders/${id}`)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleTableSort}
        emptyMessage={EMPTY_MESSAGES[activeTab]}
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
