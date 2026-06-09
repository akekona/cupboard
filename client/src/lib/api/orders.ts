import { api } from '@/lib/api'
import type {
  Order,
  OrderSummary,
  CreateOrderRequest,
  UpdateOrderRequest,
} from '@/types/orders'
import type { PagedResponse } from '@/types/common'

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

export function getOrders(params?: {
  clientId?: number
  status?: string
  createdById?: number
  search?: string
  page?: number
  size?: number
}): Promise<PagedResponse<OrderSummary>> {
  const query = new URLSearchParams()
  if (params?.clientId) query.set('clientId', String(params.clientId))
  if (params?.status) query.set('status', params.status)
  if (params?.createdById) query.set('createdById', String(params.createdById))
  if (params?.search) query.set('search', params.search)
  query.set('page', String(params?.page ?? 0))
  query.set('size', String(params?.size ?? 50))
  const qs = query.toString()
  return unwrap(api.get<ApiResponse<PagedResponse<OrderSummary>>>(`/api/orders${qs ? `?${qs}` : ''}`))
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
