import { api } from '@/lib/api'
import type {
  Order,
  OrderSummary,
  CreateOrderRequest,
  UpdateOrderRequest,
} from '@/types/orders'

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

export function getOrders(filters?: {
  clientId?: number
  status?: string
  createdById?: number
}): Promise<OrderSummary[]> {
  const params = new URLSearchParams()
  if (filters?.clientId) params.set('clientId', String(filters.clientId))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.createdById) params.set('createdById', String(filters.createdById))
  const qs = params.toString()
  return unwrap(api.get<ApiResponse<OrderSummary[]>>(`/api/orders${qs ? `?${qs}` : ''}`))
}

export const getOrderById = (id: number) =>
  unwrap(api.get<ApiResponse<Order>>(`/api/orders/${id}`))

export const createOrder = (data: CreateOrderRequest) =>
  unwrap(api.post<ApiResponse<Order>>('/api/orders', data as unknown as Record<string, unknown>))

export const updateOrder = (id: number, data: UpdateOrderRequest) =>
  unwrap(api.put<ApiResponse<Order>>(`/api/orders/${id}`, data as unknown as Record<string, unknown>))

export const confirmOrder = (id: number) =>
  unwrap(api.patch<ApiResponse<Order>>(`/api/orders/${id}/confirm`, {}))

export const shipOrder = (id: number) =>
  unwrap(api.patch<ApiResponse<Order>>(`/api/orders/${id}/ship`, {}))

export const fulfillOrder = (id: number) =>
  unwrap(api.patch<ApiResponse<Order>>(`/api/orders/${id}/fulfill`, {}))

export const deleteOrder = (id: number) =>
  api.delete<void>(`/api/orders/${id}`)
