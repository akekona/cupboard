import { getAuthCookie } from '@/lib/auth'
import type { Invoice, InvoiceSummary, InvoiceStats, Payment, PaymentStats } from '@/types/invoices'

const BASE = 'http://localhost:8080'

async function req<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = getAuthCookie()
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

export function getInvoices(filters?: { clientId?: number; status?: string }): Promise<InvoiceSummary[]> {
  const params = new URLSearchParams()
  if (filters?.clientId) params.set('clientId', String(filters.clientId))
  if (filters?.status) params.set('status', filters.status)
  const qs = params.toString()
  return req(`/api/invoices${qs ? `?${qs}` : ''}`)
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

export const getPayments     = ()            => req<Payment[]>('/api/payments')
export const getPaymentStats = ()            => req<PaymentStats>('/api/payments/stats')
