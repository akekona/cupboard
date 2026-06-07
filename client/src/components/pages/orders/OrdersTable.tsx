import { formatCurrency } from '@/lib/currency'
import { getOrderStatusColor, formatOrderDate, formatShortDate } from '@/lib/orderHelpers'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { StatusPill } from '@/components/common/StatusPill'
import type { OrderSummary } from '@/types/orders'

interface Props {
  orders: OrderSummary[]
  loading?: boolean
  onRowClick: (id: number) => void
}

export function OrdersTable({ orders, loading, onRowClick }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ScrollableTable minWidth="700px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Order #', 'Client', 'Status', 'Items', 'Subtotal', 'Created by', 'Need by', 'Date'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <LoadingSkeleton rows={5} cols={8} />}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-14 text-center text-sm text-gray-400">No orders yet.</td></tr>
            )}
            {!loading && orders.map(o => (
              <tr key={o.id} onClick={() => onRowClick(o.id)} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
                <td className="px-4 py-3.5 font-medium text-[#3B6D11]">#{o.id}</td>
                <td className="px-4 py-3.5 text-gray-900">{o.clientName}</td>
                <td className="px-4 py-3.5">
                  <StatusPill status={o.status} colorClass={getOrderStatusColor(o.status)} />
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
      </ScrollableTable>
    </div>
  )
}
