import { api } from '@/lib/api'
import type { OrderDebugResponse } from '@/types/debug'

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise
  if (!res.success) throw new Error(res.message ?? 'Request failed')
  return res.data
}

export const getOrderDebugInfo = (orderId: string) =>
  unwrap(api.get<ApiResponse<OrderDebugResponse>>(`/api/debug/orders/${encodeURIComponent(orderId)}`))
