import { apiFetch } from './base'
import type { Invoice, InvoiceSummary, InvoiceStats, Payment, PaymentStats, PaymentStatus, PaymentMethod } from '@/types/invoices'

async function req<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const text = await res.text()
  const json = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw new Error(json?.message ?? `Request failed: ${res.status}`)
  }

  return json?.data
}

import type { PagedResponse } from '@/types/common'

export function getInvoices(params?: {
  clientId?: number
  status?: string
  search?: string
  page?: number
  size?: number
}): Promise<PagedResponse<InvoiceSummary>> {
  const query = new URLSearchParams()
  if (params?.clientId) query.set('clientId', String(params.clientId))
  if (params?.status) query.set('status', params.status)
  if (params?.search) query.set('search', params.search)
  query.set('page', String(params?.page ?? 0))
  query.set('size', String(params?.size ?? 50))
  const qs = query.toString()
  return req<PagedResponse<InvoiceSummary>>(`/api/invoices${qs ? `?${qs}` : ''}`)
}

export const getInvoiceById   = (id: number) => req<Invoice>(`/api/invoices/${id}`)
export const getInvoiceStats  = ()            => req<InvoiceStats>('/api/invoices/stats')

export const updateInvoice   = (id: number, data: { dueDate?: string; notes?: string }) =>
  req<Invoice>(`/api/invoices/${id}`, 'PUT', data)

export const finalizeInvoice = (id: number) => req<Invoice>(`/api/invoices/${id}/finalize`, 'PATCH')
export const sendInvoice     = (id: number) => req<Invoice>(`/api/invoices/${id}/send`, 'PATCH')
export const markOverdue     = (id: number) => req<Invoice>(`/api/invoices/${id}/overdue`, 'PATCH')
export const markPaid        = (id: number) => req<Invoice>(`/api/invoices/${id}/mark-paid`, 'PATCH')
export const refundInvoice   = (id: number) => req<Invoice>(`/api/invoices/${id}/refund`, 'PATCH')

export function getPayments(params?: {
  status?: PaymentStatus
  paymentMethod?: PaymentMethod
  search?: string
  month?: number
  year?: number
  page?: number
  size?: number
}): Promise<PagedResponse<Payment>> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod)
  if (params?.search) query.set('search', params.search)
  if (params?.month) query.set('month', String(params.month))
  if (params?.year) query.set('year', String(params.year))
  query.set('page', String(params?.page ?? 0))
  query.set('size', String(params?.size ?? 50))
  const qs = query.toString()
  return req<PagedResponse<Payment>>(`/api/payments${qs ? `?${qs}` : ''}`)
}
export const getPaymentStats = ()            => req<PaymentStats>('/api/payments/stats')
