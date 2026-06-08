'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthUser, redirectUnauthorized } from '@/lib/auth'
import { getReportsData } from '@/lib/api/dashboard'
import { PageHeader } from '@/components/common/PageHeader'
import { RevenueChart } from '@/components/pages/dashboard/RevenueChart'
import { TopClientsChart } from '@/components/pages/reports/TopClientsChart'
import { TopProductsTable } from '@/components/pages/reports/TopProductsTable'
import { OrderVolumeChart } from '@/components/pages/reports/OrderVolumeChart'
import type { ReportsData } from '@/types/dashboard'

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function ReportsPage() {
  const router = useRouter()
  const user = getAuthUser()
  const isAdminOrDev = user?.roles.includes('ADMIN') || user?.roles.includes('DEVELOPER')

  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdminOrDev) { redirectUnauthorized(router); return }
    getReportsData().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const skeleton = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-64 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="page-container">
      <PageHeader title="Reports" />
      {loading ? skeleton : !data ? (
        <div className="text-center py-20 text-gray-400 text-sm">Reports data unavailable.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardShell title="Revenue by month">
            <RevenueChart data={data.revenueByMonth} />
          </CardShell>
          <CardShell title="Top clients by spend">
            <TopClientsChart clients={data.topClients} currency="USD" />
          </CardShell>
          <CardShell title="Order volume">
            <OrderVolumeChart data={data.orderVolumeByMonth} />
          </CardShell>
          <CardShell title="Top products by revenue">
            <TopProductsTable products={data.topProducts} currency="USD" />
          </CardShell>
        </div>
      )}
    </div>
  )
}
