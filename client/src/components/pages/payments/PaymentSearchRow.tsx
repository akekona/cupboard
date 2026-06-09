'use client'

import { Search, X } from 'lucide-react'
import { getPaymentMethodLabel } from '@/lib/invoiceHelpers'
import type { PaymentStatus, PaymentMethod } from '@/types/invoices'

const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']
const PAYMENT_METHODS: PaymentMethod[] = ['STRIPE_CARD', 'STRIPE_ACH', 'BANK_TRANSFER', 'CHECK', 'CASH']

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i)

interface Props {
  searchValue: string
  activeSearch: string
  statusFilter: PaymentStatus | ''
  methodFilter: PaymentMethod | ''
  monthFilter: number | null
  yearFilter: number | null
  onSearchChange: (val: string) => void
  onSearchSubmit: () => void
  onClearSearch: () => void
  onStatusChange: (status: PaymentStatus | '') => void
  onMethodChange: (method: PaymentMethod | '') => void
  onMonthChange: (month: number | null) => void
  onYearChange: (year: number | null) => void
}

const selectClass = 'py-2 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]'

export function PaymentSearchRow({
  searchValue, activeSearch, statusFilter, methodFilter, monthFilter, yearFilter,
  onSearchChange, onSearchSubmit, onClearSearch,
  onStatusChange, onMethodChange, onMonthChange, onYearChange,
}: Props) {
  void activeSearch // available for future use (e.g. active badge)

  function handleMonthChange(val: string) {
    if (!val) {
      onMonthChange(null)
    } else {
      const month = Number(val)
      if (!yearFilter) onYearChange(CURRENT_YEAR)
      onMonthChange(month)
    }
  }

  function handleYearChange(val: string) {
    if (!val) {
      onMonthChange(null)
      onYearChange(null)
    } else {
      onYearChange(Number(val))
    }
  }

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

        <select
          value={monthFilter ?? ''}
          onChange={e => handleMonthChange(e.target.value)}
          className={selectClass}
        >
          <option value="">All months</option>
          {MONTH_OPTIONS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>

        <select
          value={yearFilter ?? ''}
          onChange={e => handleYearChange(e.target.value)}
          className={selectClass}
        >
          <option value="">All years</option>
          {YEAR_OPTIONS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
