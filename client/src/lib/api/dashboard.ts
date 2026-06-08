import { api } from '@/lib/api'
import type { DashboardData, ReportsData } from '@/types/dashboard'

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

async function unwrap<T>(p: Promise<ApiResponse<T>>): Promise<T> {
  const res = await p
  if (!res.success) throw new Error(res.message ?? 'Request failed')
  return res.data
}

export const getDashboardData = () =>
  unwrap(api.get<ApiResponse<DashboardData>>('/api/dashboard'))

export const getReportsData = () =>
  unwrap(api.get<ApiResponse<ReportsData>>('/api/reports'))
