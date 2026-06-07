'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { getOrders } from '@/lib/api/orders'
import { PageHeader } from '@/components/common/PageHeader'
import { OrdersTable } from '@/components/pages/orders/OrdersTable'
import type { OrderStatus, OrderSummary } from '@/types/orders'

const STATUSES: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'FULFILLED']

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

  useEffect(() => {
    setLoading(true)
    getOrders(statusFilter ? { status: statusFilter } : undefined)
      .then(setOrders).catch(() => {}).finally(() => setLoading(false))
  }, [statusFilter])

  const displayed = search
    ? orders.filter(o => o.clientName.toLowerCase().includes(search.toLowerCase()))
    : orders

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

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client…"
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] w-52" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <OrdersTable
        orders={displayed}
        loading={loading}
        onRowClick={id => router.push(`/dashboard/orders/${id}`)}
      />
    </div>
  )
}
