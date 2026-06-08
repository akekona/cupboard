import { formatCurrency } from '@/lib/currency'
import { KpiRow } from '@/components/common/KpiRow'
import { RevenueChart } from './RevenueChart'
import { ActivityFeed } from './ActivityFeed'
import type { DashboardData } from '@/types/dashboard'
import type { CurrencyCode } from '@/lib/currency'

interface Props {
  data: DashboardData
  currency: CurrencyCode
}

function pct(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - prev) / prev) * 100
  return `${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% vs last month`
}

function orderDiff(current: number, prev: number): string {
  const diff = current - prev
  if (diff === 0) return 'Same as last month'
  return `${diff > 0 ? '↑' : '↓'} ${Math.abs(diff)} vs last month`
}

export function AdminDashboard({ data, currency }: Props) {
  const { stats, revenueByMonth, recentActivity } = data
  const hasOverdue = stats.overdueInvoicesCount > 0

  return (
    <div className="space-y-6">
      <KpiRow
        cols={4}
        cards={[
          {
            label: 'Revenue this month',
            value: formatCurrency(stats.totalRevenueThisMonth, currency),
            subtext: pct(stats.totalRevenueThisMonth, stats.revenueLastMonth),
            valueClassName: 'text-[#3B6D11]',
          },
          {
            label: 'Orders this month',
            value: String(stats.ordersThisMonth),
            subtext: orderDiff(stats.ordersThisMonth, stats.ordersLastMonth),
          },
          {
            label: 'Outstanding invoices',
            value: formatCurrency(stats.outstandingInvoicesAmount, currency),
            subtext: stats.outstandingInvoicesCount > 0
              ? `${stats.outstandingInvoicesCount} invoice${stats.outstandingInvoicesCount !== 1 ? 's' : ''}${hasOverdue ? ` · ${stats.overdueInvoicesCount} overdue` : ''}`
              : 'All paid up',
            valueClassName: stats.outstandingInvoicesCount > 0 ? 'text-amber-600' : undefined,
          },
          {
            label: 'Low stock items',
            value: String(stats.lowStockCount),
            subtext: stats.lowStockCount > 0 ? 'Needs restock' : 'All stocked',
            valueClassName: stats.lowStockCount > 0 ? 'text-amber-600' : undefined,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue — last 6 months</h2>
          <RevenueChart data={revenueByMonth} />
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent activity</h2>
          <ActivityFeed activities={recentActivity} />
        </div>
      </div>
    </div>
  )
}
