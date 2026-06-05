'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { getOrders } from '@/lib/api/orders'
import { formatCurrency } from '@/lib/currency'
import { getOrderStatusColor, formatShortDate, formatOrderDate } from '@/lib/orderHelpers'
import type { OrderStatus, OrderSummary } from '@/types/orders'

const STATUSES: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'FULFILLED']

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

  async function load() {
    setLoading(true)
    try {
      const data = await getOrders(statusFilter ? { status: statusFilter } : undefined)
      setOrders(data)
    } catch { /* handled */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const displayed = search
    ? orders.filter(o => o.clientName.toLowerCase().includes(search.toLowerCase()))
    : orders

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <button
          onClick={() => router.push('/dashboard/orders/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New order
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client…"
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] w-52"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Order #', 'Client', 'Status', 'Items', 'Subtotal', 'Created by', 'Need by', 'Date'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '40%' : '70%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-sm text-gray-400">
                  {search || statusFilter ? 'No orders match your filters.' : 'No orders yet.'}
                </td>
              </tr>
            )}

            {!loading && displayed.map(o => (
              <tr
                key={o.id}
                onClick={() => router.push(`/dashboard/orders/${o.id}`)}
                className="hover:bg-gray-50/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3.5 font-medium text-[#3B6D11]">#{o.id}</td>
                <td className="px-4 py-3.5 text-gray-900">{o.clientName}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getOrderStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}</td>
                <td className="px-4 py-3.5 font-medium text-gray-700">{formatCurrency(o.subtotal, o.currency)}</td>
                <td className="px-4 py-3.5 text-gray-500">{o.createdByName}</td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{formatOrderDate(o.needBy)}</td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{formatShortDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
