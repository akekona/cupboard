import type { OrderStatus } from '@/types/orders'

export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'DRAFT':     return 'bg-gray-100 text-gray-600'
    case 'CONFIRMED': return 'bg-purple-100 text-purple-700'
    case 'SHIPPED':   return 'bg-amber-100 text-amber-700'
    case 'FULFILLED': return 'bg-[#EAF3DE] text-[#3B6D11]'
  }
}

export function getNextOrderAction(status: OrderStatus): string | null {
  switch (status) {
    case 'DRAFT':     return 'Confirm order'
    case 'CONFIRMED': return 'Mark as shipped'
    case 'SHIPPED':   return 'Mark as fulfilled'
    case 'FULFILLED': return null
  }
}

export function canEditOrder(status: OrderStatus): boolean {
  return status === 'DRAFT'
}

export function canDeleteOrder(status: OrderStatus): boolean {
  return status === 'DRAFT'
}

export function formatOrderDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
