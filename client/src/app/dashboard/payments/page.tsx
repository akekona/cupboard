'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { getPayments, getPaymentStats } from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import { getPaymentStatusColor, getPaymentMethodLabel, getInitials, formatDateTime } from '@/lib/invoiceHelpers'
import type { Payment, PaymentStats } from '@/types/invoices'

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

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getPayments(), getPaymentStats()])
      .then(([p, s]) => { setPayments(p); setStats(s) })
      .catch(() => { /* handled */ })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Payments</h1>

      {/* KPI row */}
      <div className="flex gap-4 mb-6">
        <KpiCard
          title="Collected this month"
          value={stats ? formatCurrency(stats.collectedThisMonth, 'USD') : '—'}
          valueClass="text-green-600"
        />
        <KpiCard
          title="Pending"
          value={stats ? formatCurrency(stats.pending, 'USD') : '—'}
        />
        <KpiCard
          title="Refunded"
          value={stats ? formatCurrency(stats.refunded, 'USD') : '—'}
          valueClass={stats && stats.refunded > 0 ? 'text-red-600' : 'text-gray-900'}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Stripe ID', 'Client', 'Invoice', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '60%' : '70%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-gray-400">
                  No payments yet.
                </td>
              </tr>
            )}

            {!loading && payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                {/* Stripe ID */}
                <td className="px-4 py-3.5">
                  {p.stripePaymentId ? (
                    <span
                      title={p.stripePaymentId}
                      className="font-mono text-xs text-gray-400"
                    >
                      {p.stripePaymentId.length > 20
                        ? p.stripePaymentId.slice(0, 20) + '…'
                        : p.stripePaymentId}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>

                {/* Client */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-semibold text-white">{getInitials(p.clientName)}</span>
                    </div>
                    <span className="text-gray-900">{p.clientName}</span>
                  </div>
                </td>

                {/* Invoice */}
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => router.push(`/dashboard/invoices/${p.invoiceId}`)}
                    className="font-medium text-[#3B6D11] hover:underline text-sm"
                  >
                    {p.invoiceNumber}
                  </button>
                </td>

                {/* Amount */}
                <td className={`px-4 py-3.5 font-medium ${p.status === 'REFUNDED' ? 'text-red-600' : 'text-gray-700'}`}>
                  {p.status === 'REFUNDED' ? '−' : ''}{formatCurrency(p.amount, p.currency)}
                </td>

                {/* Method */}
                <td className="px-4 py-3.5 text-gray-500 text-xs">
                  {getPaymentMethodLabel(p.paymentMethod)}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getPaymentStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3.5 text-gray-400 text-xs">
                  {formatDateTime(p.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
        <span>All Stripe transactions processed in test mode</span>
        <span>·</span>
        <a
          href="https://dashboard.stripe.com/test/payments"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 hover:text-gray-600 transition-colors"
        >
          View Stripe dashboard
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
