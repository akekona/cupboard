import type { CurrencyCode } from '@/lib/currency'

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'FULFILLED'
export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'SENT' | 'PAID' | 'OVERDUE' | 'REFUNDED'

export interface OrderItem {
  id: number
  productId: number
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  currency: CurrencyCode
  lineTotal: number
}

export interface OrderInvoiceSummary {
  id: number
  invoiceNumber: string
  status: InvoiceStatus
  totalAmount: number
}

export interface Order {
  id: number
  client: { id: number; name: string; contactEmail?: string }
  createdBy: { id: number; firstName: string; lastName: string }
  status: OrderStatus
  currency: CurrencyCode
  needBy?: string
  notes?: string
  items: OrderItem[]
  subtotal: number
  createdAt: string
  updatedAt: string
  invoice?: OrderInvoiceSummary
}

export interface OrderSummary {
  id: number
  clientId: number
  clientName: string
  createdByName: string
  status: OrderStatus
  currency: CurrencyCode
  subtotal: number
  needBy?: string
  createdAt: string
  itemCount: number
}

export interface CreateOrderRequest {
  clientId: number
  currency: CurrencyCode
  needBy?: string
  notes?: string
  items: { productId: number; quantity: number }[]
}

export interface UpdateOrderRequest {
  needBy?: string
  notes?: string
  items?: { productId: number; quantity: number }[]
}
