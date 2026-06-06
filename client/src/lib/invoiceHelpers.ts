import type { InvoiceStatus, PaymentMethod, PaymentStatus } from '@/types/invoices'

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case 'DRAFT':     return 'bg-gray-100 text-gray-600'
    case 'FINALIZED': return 'bg-amber-100 text-amber-700'
    case 'SENT':      return 'bg-blue-100 text-blue-700'
    case 'PAID':      return 'bg-green-100 text-green-700'
    case 'OVERDUE':   return 'bg-red-100 text-red-700'
    case 'REFUNDED':  return 'bg-purple-100 text-purple-700'
  }
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':   return 'bg-amber-100 text-amber-700'
    case 'SUCCEEDED': return 'bg-green-100 text-green-700'
    case 'FAILED':    return 'bg-red-100 text-red-700'
    case 'REFUNDED':  return 'bg-purple-100 text-purple-700'
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'STRIPE_CARD':   return 'Card (Stripe)'
    case 'STRIPE_ACH':    return 'ACH (Stripe)'
    case 'BANK_TRANSFER': return 'Bank transfer'
    case 'CHECK':         return 'Check'
    case 'CASH':          return 'Cash'
  }
}

export function canFinalizeInvoice(status: InvoiceStatus): boolean {
  return status === 'DRAFT'
}

export function canSendInvoice(status: InvoiceStatus): boolean {
  return status === 'FINALIZED'
}

export function canRefundInvoice(status: InvoiceStatus): boolean {
  return status === 'PAID'
}

export function isOverdue(dueDate?: string, status?: InvoiceStatus): boolean {
  if (!dueDate || status === 'PAID' || status === 'REFUNDED') return false
  return new Date(dueDate) < new Date()
}

export function formatInvoiceDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  return `${date}, ${time}`
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}
