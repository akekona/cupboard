import type { CurrencyCode } from '@/lib/currency'
import type { OrderStatus } from '@/types/orders'

export type InvoiceStatus =
  'DRAFT' | 'FINALIZED' | 'SENT' | 'PAID' | 'OVERDUE' | 'REFUNDED'

export type PaymentMethod =
  'STRIPE_CARD' | 'STRIPE_ACH' | 'BANK_TRANSFER' | 'CHECK' | 'CASH'

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'

export interface Invoice {
  id: number
  invoiceNumber: string
  order: { id: number; status: OrderStatus; currency: CurrencyCode }
  client: { id: number; name: string; contactEmail?: string }
  totalAmount: number
  currency: CurrencyCode
  status: InvoiceStatus
  dueDate?: string
  stripeInvoiceId?: string
  stripeHostedUrl?: string
  sentAt?: string
  paidAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceSummary {
  id: number
  invoiceNumber: string
  clientId: number
  clientName: string
  totalAmount: number
  currency: CurrencyCode
  status: InvoiceStatus
  dueDate?: string
  sentAt?: string
  paidAt?: string
  orderId: number
}

export interface InvoiceStats {
  totalOutstanding: number
  totalOverdue: number
  totalPaidThisMonth: number
  overdueCount: number
  outstandingCount: number
}

export interface Payment {
  id: number
  invoiceId: number
  invoiceNumber: string
  clientId: number
  clientName: string
  stripeInvoiceId?: string
  stripePaymentId?: string
  amount: number
  currency: CurrencyCode
  paymentMethod: PaymentMethod
  status: PaymentStatus
  createdAt: string
}

export interface PaymentStats {
  collectedThisMonth: number
  pending: number
  refunded: number
}
