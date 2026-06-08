'use client'

import { useEffect, useState } from 'react'
import { getAuthUser } from '@/lib/auth'
import { getOrders } from '@/lib/api/orders'
import { getDashboardData } from '@/lib/api/dashboard'
import { AdminDashboard } from '@/components/pages/dashboard/AdminDashboard'
import { StaffDashboard } from '@/components/pages/dashboard/StaffDashboard'
import type { DashboardData } from '@/types/dashboard'
import type { OrderSummary } from '@/types/orders'

export default function DashboardPage() {
  const user = getAuthUser()
  const isAdminOrDev = user?.roles.includes('ADMIN') || user?.roles.includes('DEVELOPER')

  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [d, o] = await Promise.all([
          getDashboardData().catch(() => null),
          getOrders().catch(() => []),
        ])
        setDashData(d)
        setOrders(o)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="page-container space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 h-56 animate-pulse bg-gray-100" />
          <div className="bg-white rounded-xl border border-gray-200 p-5 h-56 animate-pulse bg-gray-100" />
        </div>
      </div>
    )
  }

  if (isAdminOrDev) {
    if (!dashData) {
      return (
        <div className="page-container">
          <div className="text-center py-20 text-gray-400 text-sm">Dashboard data unavailable.</div>
        </div>
      )
    }
    return (
      <div className="page-container">
        <AdminDashboard data={dashData} currency="USD" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <StaffDashboard
        recentOrders={orders}
        lowStockCount={dashData?.stats.lowStockCount ?? 0}
        firstName={user?.firstName ?? ''}
      />
    </div>
  )
}
