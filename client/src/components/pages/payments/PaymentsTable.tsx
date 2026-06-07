import { formatCurrency } from '@/lib/currency'
import { getPaymentStatusColor, getPaymentMethodLabel, getInitials, formatDateTime } from '@/lib/invoiceHelpers'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { StatusPill } from '@/components/common/StatusPill'
import type { Payment } from '@/types/invoices'

interface Props {
  payments: Payment[]
  loading?: boolean
  onInvoiceClick: (invoiceId: number) => void
}

export function PaymentsTable({ payments, loading, onInvoiceClick }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ScrollableTable minWidth="700px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Stripe ID', 'Client', 'Invoice', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <LoadingSkeleton rows={5} cols={7} />}
            {!loading && payments.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-gray-400">No payments yet.</td></tr>
            )}
            {!loading && payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  {p.stripePaymentId ? (
                    <span title={p.stripePaymentId} className="font-mono text-xs text-gray-400">
                      {p.stripePaymentId.length > 20 ? p.stripePaymentId.slice(0, 20) + '…' : p.stripePaymentId}
                    </span>
                  ) : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-semibold text-white">{getInitials(p.clientName)}</span>
                    </div>
                    <span className="text-gray-900">{p.clientName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => onInvoiceClick(p.invoiceId)} className="font-medium text-[#3B6D11] hover:underline text-sm">
                    {p.invoiceNumber}
                  </button>
                </td>
                <td className={`px-4 py-3.5 font-medium ${p.status === 'REFUNDED' ? 'text-red-600' : 'text-gray-700'}`}>
                  {p.status === 'REFUNDED' ? '−' : ''}{formatCurrency(p.amount, p.currency)}
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{getPaymentMethodLabel(p.paymentMethod)}</td>
                <td className="px-4 py-3.5">
                  <StatusPill status={p.status} colorClass={getPaymentStatusColor(p.status)} />
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTable>
    </div>
  )
}
