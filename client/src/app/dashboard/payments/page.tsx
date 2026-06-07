'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { getPayments, getPaymentStats } from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import { KpiRow } from '@/components/common/KpiRow'
import { PaymentsTable } from '@/components/pages/payments/PaymentsTable'
import type { Payment, PaymentStats } from '@/types/invoices'

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPayments(), getPaymentStats()])
      .then(([p, s]) => { setPayments(p); setStats(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <h1 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">Payments</h1>

      <KpiRow cards={[
        { label: 'Collected this month', value: stats ? formatCurrency(stats.collectedThisMonth, 'USD') : '—', valueClassName: 'text-green-600' },
        { label: 'Pending',   value: stats ? formatCurrency(stats.pending, 'USD') : '—' },
        { label: 'Refunded',  value: stats ? formatCurrency(stats.refunded, 'USD') : '—', valueClassName: stats && stats.refunded > 0 ? 'text-red-600' : undefined },
      ]} />

      <PaymentsTable
        payments={payments}
        loading={loading}
        onInvoiceClick={id => router.push(`/dashboard/invoices/${id}`)}
      />

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
