import { formatCurrency } from '@/lib/currency'
import type { CurrencyCode } from '@/lib/currency'

interface Props {
  totalSpend: number
  orderCount: number
  outstandingBalance: number
  currency: CurrencyCode
}

export function ClientKpiRow({ totalSpend, orderCount, outstandingBalance, currency }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-400 mb-1">Total spend</div>
        <div className="text-lg font-semibold text-gray-900">{formatCurrency(totalSpend, currency)}</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-400 mb-1">Orders</div>
        <div className="text-lg font-semibold text-gray-900">{orderCount}</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-400 mb-1">Outstanding</div>
        <div className={`text-lg font-semibold ${outstandingBalance > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
          {outstandingBalance > 0 ? formatCurrency(outstandingBalance, currency) : '—'}
        </div>
      </div>
    </div>
  )
}
