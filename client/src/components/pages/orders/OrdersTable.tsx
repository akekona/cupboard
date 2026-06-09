import { ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { getOrderStatusColor, formatOrderDate, formatShortDate } from '@/lib/orderHelpers'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { StatusPill } from '@/components/common/StatusPill'
import type { OrderSummary, OrderSortBy, SortDir } from '@/types/orders'

interface Props {
  orders: OrderSummary[]
  loading?: boolean
  onRowClick: (id: number) => void
  sortBy?: OrderSortBy
  sortDir?: SortDir
  onSort?: (field: OrderSortBy) => void
  emptyMessage?: string
}

function SortIndicator({ field, sortBy, sortDir }: { field: OrderSortBy; sortBy?: OrderSortBy; sortDir?: SortDir }) {
  if (sortBy !== field || !sortDir) return null
  return sortDir === 'asc'
    ? <ArrowUp size={11} className="inline ml-1 text-[#3B6D11]" />
    : <ArrowDown size={11} className="inline ml-1 text-[#3B6D11]" />
}

function needByClass(needBy: string | undefined, status: OrderSummary['status']): string {
  if (!needBy || status === 'FULFILLED') return 'text-gray-400'
  const [y, m, d] = needBy.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (date < today) return 'text-red-500 font-medium'
  if (date <= tomorrow) return 'text-amber-600 font-medium'
  return 'text-gray-400'
}

export function OrdersTable({ orders, loading, onRowClick, sortBy, sortDir, onSort, emptyMessage = 'No orders yet.' }: Props) {
  const thBase = 'text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3'
  const thSortable = onSort ? 'cursor-pointer hover:text-gray-600 select-none' : ''

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ScrollableTable minWidth="700px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className={thBase}>Order #</th>
              <th className={thBase}>Client</th>
              <th className={thBase}>Status</th>
              <th className={thBase}>Items</th>
              <th className={thBase}>Subtotal</th>
              <th className={thBase}>Created by</th>
              <th
                className={`${thBase} ${thSortable}`}
                onClick={() => onSort?.('needBy')}
              >
                Need by
                <SortIndicator field="needBy" sortBy={sortBy} sortDir={sortDir} />
              </th>
              <th
                className={`${thBase} ${thSortable}`}
                onClick={() => onSort?.('createdAt')}
              >
                Date
                <SortIndicator field="createdAt" sortBy={sortBy} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <LoadingSkeleton rows={5} cols={8} />}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-14 text-center text-sm text-gray-400">{emptyMessage}</td></tr>
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
                <td className={`px-4 py-3.5 text-xs ${needByClass(o.needBy, o.status)}`}>
                  {formatOrderDate(o.needBy)}
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{formatShortDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTable>
    </div>
  )
}
