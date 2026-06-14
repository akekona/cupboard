import type { CurrencyCode } from '@/lib/currency'
import type { OrderStatus } from '@/types/orders'
import type { InvoiceStatus, PaymentStatus, PaymentMethod } from '@/types/invoices'

export interface OrderItemDebugInfo {
  productName: string
  sku: string
  quantity: number
  unitPrice: number
}

export interface OrderDebugInfo {
  id: number
  status: OrderStatus
  clientName: string
  clientId: number
  createdByName: string
  createdAt: string
  needBy: string | null
  totalAmount: number
  currency: CurrencyCode
  items: OrderItemDebugInfo[]
}

export interface InvoiceDebugInfo {
  id: number
  invoiceNumber: string
  status: InvoiceStatus
  dueDate: string | null
  sentAt: string | null
  paidAt: string | null
  totalAmount: number
  currency: CurrencyCode
  stripeInvoiceId: string | null
  stripeInvoiceUrl: string | null
}

export interface PaymentDebugInfo {
  id: number
  status: PaymentStatus
  paymentMethod: PaymentMethod
  amount: number
  currency: CurrencyCode
  createdAt: string
  stripePaymentId: string | null
  stripePaymentUrl: string | null
}

export interface OrderDebugResponse {
  order: OrderDebugInfo
  invoice: InvoiceDebugInfo | null
  payment: PaymentDebugInfo | null
  flags: string[]
}
