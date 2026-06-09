'use client'

import { Search, X } from 'lucide-react'
import { getPaymentMethodLabel } from '@/lib/invoiceHelpers'
import type { PaymentStatus, PaymentMethod } from '@/types/invoices'

const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']
const PAYMENT_METHODS: PaymentMethod[] = ['STRIPE_CARD', 'STRIPE_ACH', 'BANK_TRANSFER', 'CHECK', 'CASH']

interface Props {
  searchValue: string
  activeSearch: string
  statusFilter: PaymentStatus | ''
  methodFilter: PaymentMethod | ''
  onSearchChange: (val: string) => void
  onSearchSubmit: () => void
  onClearSearch: () => void
  onStatusChange: (status: PaymentStatus | '') => void
  onMethodChange: (method: PaymentMethod | '') => void
}

const selectClass = 'py-2 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]'

export function PaymentSearchRow({
  searchValue, activeSearch, statusFilter, methodFilter,
  onSearchChange, onSearchSubmit, onClearSearch,
  onStatusChange, onMethodChange,
}: Props) {
  void activeSearch // available for future use (e.g. active badge)

  return (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      <div className="relative flex-1 max-w-sm min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearchSubmit()}
          placeholder="Search by Stripe ID, client, or invoice..."
          className="w-full pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
        />
        {searchValue && (
          <button onClick={onClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20 flex items-center justify-center">
            <X size={10} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <select
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value as PaymentStatus | '')}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>

        <select
          value={methodFilter}
          onChange={e => onMethodChange(e.target.value as PaymentMethod | '')}
          className={selectClass}
        >
          <option value="">All methods</option>
          {PAYMENT_METHODS.map(m => (
            <option key={m} value={m}>{getPaymentMethodLabel(m)}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
