import { formatCurrency } from '@/lib/currency'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import type { OrderItem } from '@/types/orders'
import type { CurrencyCode } from '@/lib/currency'

interface Props {
  items: OrderItem[]
  currency: CurrencyCode
  subtotal: number
}

export function OrderItemsTable({ items, currency, subtotal }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Order items</h2>
      </div>
      <ScrollableTable minWidth="500px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Product', 'SKU', 'Unit price', 'Qty', 'Line total'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-5 py-3 font-medium text-gray-900">{item.productName}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-400">{item.productSku}</td>
                <td className="px-5 py-3 text-gray-600">{formatCurrency(item.unitPrice, item.currency)}</td>
                <td className="px-5 py-3 text-gray-700">×{item.quantity}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">{formatCurrency(item.lineTotal, item.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTable>
      <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
        <div className="text-right">
          <span className="text-xs text-gray-400 uppercase tracking-wide mr-4">Subtotal</span>
          <span className="text-base font-semibold text-gray-900">{formatCurrency(subtotal, currency)}</span>
        </div>
      </div>
    </div>
  )
}
