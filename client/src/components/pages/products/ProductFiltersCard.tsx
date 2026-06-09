'use client'

import { X } from 'lucide-react'
import type { ProductCategory } from '@/types/catalog'
import { CAT_LABEL, CATEGORIES } from './CategoryPills'

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export const STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
}
export const STATUSES: StockStatus[] = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']

interface Props {
  selectedCategories: ProductCategory[]
  selectedStatuses: StockStatus[]
  onCategoryToggle: (cat: ProductCategory) => void
  onStatusToggle: (status: StockStatus) => void
  onClearCategories: () => void
  onClearStatuses: () => void
  onClearAll: () => void
}

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
        selected
          ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
          : 'bg-white text-[#3B6D11] border border-[#3B6D11] hover:bg-[#EAF3DE]'
      }`}
    >
      {label}
    </button>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#EAF3DE] text-[#3B6D11] text-xs font-medium rounded-full px-3 py-1">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-[#3B6D11] text-white flex items-center justify-center hover:bg-[#27500A] transition-colors"
      >
        <X size={8} />
      </button>
    </span>
  )
}

export function ProductFiltersCard({
  selectedCategories,
  selectedStatuses,
  onCategoryToggle,
  onStatusToggle,
  onClearCategories,
  onClearStatuses,
  onClearAll,
}: Props) {
  const hasActiveFilters = selectedCategories.length > 0 || selectedStatuses.length > 0
  const totalActive = selectedCategories.length + selectedStatuses.length

  return (
    <div className="hidden md:block bg-background border border-border rounded-lg p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Filters</span>
        {hasActiveFilters && (
          <button onClick={onClearAll} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="border-t border-border mt-3 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Category</span>
          {selectedCategories.length > 0 && (
            <span className="text-xs text-[#3B6D11] font-medium">({selectedCategories.length})</span>
          )}
          {selectedCategories.length === 0 && (
            <span className="ml-auto text-xs text-muted-foreground italic">Select multiple</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill label="All" selected={selectedCategories.length === 0} onClick={onClearCategories} />
          {CATEGORIES.map(cat => (
            <Pill key={cat} label={CAT_LABEL[cat]} selected={selectedCategories.includes(cat)} onClick={() => onCategoryToggle(cat)} />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="border-t border-border mt-3 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Status</span>
          {selectedStatuses.length > 0 && (
            <span className="text-xs text-[#3B6D11] font-medium">({selectedStatuses.length})</span>
          )}
          {selectedStatuses.length === 0 && (
            <span className="ml-auto text-xs text-muted-foreground italic">Select multiple</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill label="All" selected={selectedStatuses.length === 0} onClick={onClearStatuses} />
          {STATUSES.map(s => (
            <Pill key={s} label={STATUS_LABELS[s]} selected={selectedStatuses.includes(s)} onClick={() => onStatusToggle(s)} />
          ))}
        </div>
      </div>

      {/* Active chips */}
      {hasActiveFilters && (
        <div className="border-t border-border mt-3 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategories.map(cat => (
              <Chip key={cat} label={CAT_LABEL[cat]} onRemove={() => onCategoryToggle(cat)} />
            ))}
            {selectedStatuses.map(s => (
              <Chip key={s} label={STATUS_LABELS[s]} onRemove={() => onStatusToggle(s)} />
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              {totalActive} filter{totalActive !== 1 ? 's' : ''} active
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
