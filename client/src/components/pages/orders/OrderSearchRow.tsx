'use client'

import { Search, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { User } from '@/types/users'
import type { OrderSortBy, SortDir } from '@/types/orders'

interface Props {
  orderNumberInput: string
  clientSearchInput: string
  createdByFilter: number | null
  sortBy: OrderSortBy
  sortDir: SortDir
  users: User[]
  isAdmin: boolean
  onOrderNumberChange: (val: string) => void
  onClientSearchChange: (val: string) => void
  onOrderNumberSearch: () => void
  onClientSearch: () => void
  onClearOrderNumber: () => void
  onClearClientSearch: () => void
  onCreatedByChange: (userId: number | null) => void
  onSortChange: (field: OrderSortBy, dir: SortDir) => void
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={13} className="text-muted-foreground" />
  return dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
}

export function OrderSearchRow({
  orderNumberInput, clientSearchInput, createdByFilter, sortBy, sortDir,
  users, isAdmin,
  onOrderNumberChange, onClientSearchChange,
  onOrderNumberSearch, onClientSearch,
  onClearOrderNumber, onClearClientSearch,
  onCreatedByChange, onSortChange,
}: Props) {
  function handleSortClick(field: OrderSortBy) {
    if (sortBy === field) {
      onSortChange(field, sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(field, field === 'needBy' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {/* Order number search */}
        <div className="relative w-36">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={orderNumberInput}
            onChange={e => onOrderNumberChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onOrderNumberSearch()}
            placeholder="#1042 or 42..."
            className="w-full pl-7 pr-7 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
          />
          {orderNumberInput && (
            <button onClick={onClearOrderNumber}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20 flex items-center justify-center">
              <X size={9} />
            </button>
          )}
        </div>

        {/* Client name search */}
        <div className="relative flex-1 max-w-xs min-w-36">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={clientSearchInput}
            onChange={e => onClientSearchChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onClientSearch()}
            placeholder="Search by cafe..."
            className="w-full pl-7 pr-7 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
          />
          {clientSearchInput && (
            <button onClick={onClearClientSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20 flex items-center justify-center">
              <X size={9} />
            </button>
          )}
        </div>

        {/* Created by dropdown (admin only) */}
        {isAdmin && (
          <select
            value={createdByFilter ?? ''}
            onChange={e => onCreatedByChange(e.target.value ? Number(e.target.value) : null)}
            className="py-1.5 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
          >
            <option value="">All staff</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName.charAt(0)}.
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <span className="text-xs text-muted-foreground">Sort:</span>
        {(['createdAt', 'needBy'] as OrderSortBy[]).map(field => {
          const active = sortBy === field
          return (
            <button
              key={field}
              onClick={() => handleSortClick(field)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors ${
                active
                  ? 'bg-[#EAF3DE] text-[#3B6D11] border-[#3B6D11]'
                  : 'text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {field === 'createdAt' ? 'Date' : 'Need by'}
              <SortIcon active={active} dir={sortDir} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
