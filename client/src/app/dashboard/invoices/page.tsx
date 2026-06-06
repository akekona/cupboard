'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { getInvoices, getInvoiceStats } from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import { getInvoiceStatusColor, getInitials, formatInvoiceDate, isOverdue } from '@/lib/invoiceHelpers'
import type { InvoiceSummary, InvoiceStats, InvoiceStatus } from '@/types/invoices'

const STATUSES: InvoiceStatus[] = ['DRAFT', 'FINALIZED', 'SENT', 'PAID', 'OVERDUE', 'REFUNDED']

function KpiCard({
  title, value, subtitle, valueClass = 'text-gray-900',
}: { title: string; value: string; subtitle?: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</div>
      <div className={`text-2xl font-bold mb-0.5 ${valueClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
    </div>
  )
}

export default function InvoicesPage() {
  const router = useRouter()

  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')

  async function load() {
    setLoading(true)
    try {
      const [data, statsData] = await Promise.all([
        getInvoices(statusFilter ? { status: statusFilter } : undefined),
        getInvoiceStats(),
      ])
      setInvoices(data)
      setStats(statsData)
    } catch { /* handled */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const displayed = search
    ? invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()))
    : invoices

  return (
    <div className="p-8">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Invoices</h1>

      {/* KPI row */}
      <div className="flex gap-4 mb-6">
        <KpiCard
          title="Total outstanding"
          value={stats ? formatCurrency(stats.totalOutstanding, 'USD') : '—'}
          valueClass={stats && stats.totalOutstanding > 0 ? 'text-amber-600' : 'text-gray-900'}
        />
        <KpiCard
          title="Overdue"
          value={stats ? formatCurrency(stats.totalOverdue, 'USD') : '—'}
          subtitle={stats ? `${stats.overdueCount} invoice${stats.overdueCount !== 1 ? 's' : ''} overdue` : undefined}
          valueClass={stats && stats.totalOverdue > 0 ? 'text-red-600' : 'text-gray-900'}
        />
        <KpiCard
          title="Paid this month"
          value={stats ? formatCurrency(stats.totalPaidThisMonth, 'USD') : '—'}
          valueClass="text-green-600"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice or client…"
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] w-60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as InvoiceStatus | '')}
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
              {['Invoice', 'Client', 'Order', 'Status', 'Amount', 'Due date', ''].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '40%' : '65%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-gray-400">
                  {search || statusFilter ? 'No invoices match your filters.' : 'No invoices yet.'}
                </td>
              </tr>
            )}

            {!loading && displayed.map(inv => {
              const overdue = isOverdue(inv.dueDate, inv.status)
              return (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  {/* Invoice number */}
                  <td className="px-4 py-3.5 font-medium text-[#3B6D11]">
                    {inv.invoiceNumber}
                  </td>

                  {/* Client */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-semibold text-white">{getInitials(inv.clientName)}</span>
                      </div>
                      <span className="text-gray-900">{inv.clientName}</span>
                    </div>
                  </td>

                  {/* Order */}
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/dashboard/orders/${inv.orderId}`)}
                      className="text-gray-500 hover:text-[#3B6D11] hover:underline text-xs"
                    >
                      #{inv.orderId}
                    </button>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getInvoiceStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 font-medium text-gray-700">
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </td>

                  {/* Due date */}
                  <td className={`px-4 py-3.5 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {inv.dueDate ? formatInvoiceDate(inv.dueDate) : '—'}
                  </td>

                  {/* View */}
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                      View
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
