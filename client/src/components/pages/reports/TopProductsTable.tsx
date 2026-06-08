import { formatCurrency } from '@/lib/currency'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import type { TopProduct } from '@/types/dashboard'
import type { CurrencyCode } from '@/lib/currency'

interface Props {
  products: TopProduct[]
  currency: CurrencyCode
}

export function TopProductsTable({ products, currency }: Props) {
  const data = products.slice(0, 5)

  return (
    <ScrollableTable minWidth="420px">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {['Product', 'SKU', 'Units sold', 'Revenue'].map(h => (
              <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">No product data</td></tr>
          )}
          {data.map(p => (
            <tr key={p.productId} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.sku}</td>
              <td className="px-4 py-3 text-gray-700">{p.totalQuantity.toLocaleString()}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(p.totalRevenue, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableTable>
  )
}
