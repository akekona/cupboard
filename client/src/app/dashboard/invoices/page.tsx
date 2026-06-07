'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { getInvoices, getInvoiceStats } from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import { KpiRow } from '@/components/common/KpiRow'
import { InvoicesTable } from '@/components/pages/invoices/InvoicesTable'
import type { InvoiceSummary, InvoiceStats, InvoiceStatus } from '@/types/invoices'

const STATUSES: InvoiceStatus[] = ['DRAFT', 'FINALIZED', 'SENT', 'PAID', 'OVERDUE', 'REFUNDED']

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getInvoices(statusFilter ? { status: statusFilter } : undefined),
      getInvoiceStats(),
    ]).then(([data, s]) => { setInvoices(data); setStats(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  const displayed = search
    ? invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()))
    : invoices

  return (
    <div className="page-container">
      <h1 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">Invoices</h1>

      <KpiRow cards={[
        { label: 'Total outstanding', value: stats ? formatCurrency(stats.totalOutstanding, 'USD') : '—', valueClassName: stats && stats.totalOutstanding > 0 ? 'text-amber-600' : undefined },
        { label: 'Overdue',           value: stats ? formatCurrency(stats.totalOverdue, 'USD') : '—',      subtext: stats ? `${stats.overdueCount} invoice${stats.overdueCount !== 1 ? 's' : ''} overdue` : undefined, valueClassName: stats && stats.totalOverdue > 0 ? 'text-red-600' : undefined },
        { label: 'Paid this month',   value: stats ? formatCurrency(stats.totalPaidThisMonth, 'USD') : '—', valueClassName: 'text-green-600' },
      ]} />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice or client…"
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] w-60" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as InvoiceStatus | '')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <InvoicesTable
        invoices={displayed}
        loading={loading}
        onRowClick={id => router.push(`/dashboard/invoices/${id}`)}
        onOrderClick={id => router.push(`/dashboard/orders/${id}`)}
      />
    </div>
  )
}
