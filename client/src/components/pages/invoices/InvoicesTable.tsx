import { formatCurrency } from '@/lib/currency'
import { getInvoiceStatusColor, getInitials, formatInvoiceDate, isOverdue } from '@/lib/invoiceHelpers'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { StatusPill } from '@/components/common/StatusPill'
import type { InvoiceSummary } from '@/types/invoices'

interface Props {
  invoices: InvoiceSummary[]
  loading?: boolean
  onRowClick: (id: number) => void
  onOrderClick: (orderId: number) => void
}

export function InvoicesTable({ invoices, loading, onRowClick, onOrderClick }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ScrollableTable minWidth="700px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Invoice', 'Client', 'Order', 'Status', 'Amount', 'Due date', ''].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <LoadingSkeleton rows={5} cols={7} />}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-gray-400">No invoices yet.</td></tr>
            )}
            {!loading && invoices.map(inv => {
              const overdue = isOverdue(inv.dueDate, inv.status)
              return (
                <tr key={inv.id} onClick={() => onRowClick(inv.id)} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3.5 font-medium text-[#3B6D11]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-semibold text-white">{getInitials(inv.clientName)}</span>
                      </div>
                      <span className="text-gray-900">{inv.clientName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onOrderClick(inv.orderId)} className="text-gray-500 hover:text-[#3B6D11] hover:underline text-xs">
                      #{inv.orderId}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={inv.status} colorClass={getInvoiceStatusColor(inv.status)} />
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-700">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                  <td className={`px-4 py-3.5 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {inv.dueDate ? formatInvoiceDate(inv.dueDate) : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md">View</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollableTable>
    </div>
  )
}
