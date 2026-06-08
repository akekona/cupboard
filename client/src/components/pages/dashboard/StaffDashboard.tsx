import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/currency'
import { getOrderStatusColor, formatShortDate } from '@/lib/orderHelpers'
import { StatusPill } from '@/components/common/StatusPill'
import type { OrderSummary } from '@/types/orders'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function ordersThisMonth(orders: OrderSummary[]): number {
  const now = new Date()
  return orders.filter(o => {
    const d = new Date(o.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
}

interface Props {
  recentOrders: OrderSummary[]
  lowStockCount: number
  firstName: string
}

export function StaffDashboard({ recentOrders, lowStockCount, firstName }: Props) {
  const router = useRouter()
  const thisMonth = ordersThisMonth(recentOrders)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Good {greeting()}, {firstName}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening today.</p>
      </div>

      {/* KPIs + action */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Orders this month</div>
          <div className="text-3xl font-bold text-gray-900">{thisMonth}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Low stock alerts</div>
          <div className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {lowStockCount}
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/orders/new')}
            className="px-5 py-3 text-sm font-medium text-white bg-[#3B6D11] rounded-xl hover:bg-[#2f5a0e] transition-colors whitespace-nowrap"
          >
            New order →
          </button>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No orders yet.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Order #', 'Client', 'Status', 'Total', 'Date'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/orders/${o.id}`)}>
                    <td className="px-5 py-3 font-medium text-[#3B6D11]">#{o.id}</td>
                    <td className="px-5 py-3 text-gray-900">{o.clientName}</td>
                    <td className="px-5 py-3"><StatusPill status={o.status} colorClass={getOrderStatusColor(o.status)} /></td>
                    <td className="px-5 py-3 font-medium text-gray-700">{formatCurrency(o.subtotal, o.currency)}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatShortDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100">
              <Link href="/dashboard/orders" className="text-xs font-medium text-[#3B6D11] hover:underline">
                View all orders →
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 text-sm font-bold">!</span>
            </div>
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{lowStockCount} product{lowStockCount !== 1 ? 's' : ''}</span>
              {' '}below reorder threshold
            </p>
          </div>
          <Link href="/dashboard/products" className="text-xs font-medium text-amber-700 hover:underline whitespace-nowrap">
            View products →
          </Link>
        </div>
      )}
    </div>
  )
}
