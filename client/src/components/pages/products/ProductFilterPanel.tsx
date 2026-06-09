'use client'

import { Popover } from 'radix-ui'
import { ChevronDown, CheckSquare, Square, X } from 'lucide-react'
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
  totalCount: number
  filteredCount: number
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
        selected
          ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
          : 'border-[#3B6D11] text-[#3B6D11] bg-white hover:bg-[#EAF3DE]'
      }`}
    >
      {label}
    </button>
  )
}

function FilterDropdown<T extends string>({
  label,
  options,
  getLabel,
  selected,
  onToggle,
  onClearAll,
}: {
  label: string
  options: T[]
  getLabel: (v: T) => string
  selected: T[]
  onToggle: (v: T) => void
  onClearAll: () => void
}) {
  const count = selected.length
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          {label}{count > 0 && ` (${count})`}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={5}
          align="start"
          className="bg-white border border-border rounded-lg shadow-lg z-50 min-w-[180px] p-1 focus:outline-none"
        >
          <DropdownOption
            label="All"
            checked={count === 0}
            onClick={onClearAll}
          />
          {options.map(opt => (
            <DropdownOption
              key={opt}
              label={getLabel(opt)}
              checked={selected.includes(opt)}
              onClick={() => onToggle(opt)}
            />
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function DropdownOption({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 w-full text-sm rounded hover:bg-gray-50 text-left"
    >
      {checked
        ? <CheckSquare className="w-4 h-4 text-[#3B6D11] flex-shrink-0" />
        : <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      <span className={checked ? 'text-[#3B6D11] font-medium' : 'text-gray-700'}>{label}</span>
    </button>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export function ProductFilterPanel({
  selectedCategories,
  selectedStatuses,
  onCategoryToggle,
  onStatusToggle,
  onClearCategories,
  onClearStatuses,
  onClearAll,
  totalCount,
  filteredCount,
}: Props) {
  const hasActiveFilters = selectedCategories.length > 0 || selectedStatuses.length > 0

  return (
    <div className="mb-5">

      {/* ── Desktop filter card ───────────────────────────────── */}
      <div className="hidden md:block bg-white border border-border rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-900">Filters</span>
          {hasActiveFilters && (
            <button onClick={onClearAll} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Clear all
            </button>
          )}
        </div>

        {/* Category */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Category</span>
              {selectedCategories.length > 0 && (
                <span className="text-xs text-[#3B6D11] font-medium">({selectedCategories.length})</span>
              )}
            </div>
            {selectedCategories.length === 0 && (
              <span className="text-xs text-muted-foreground italic">Select multiple</span>
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
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Status</span>
              {selectedStatuses.length > 0 && (
                <span className="text-xs text-[#3B6D11] font-medium">({selectedStatuses.length})</span>
              )}
            </div>
            {selectedStatuses.length === 0 && (
              <span className="text-xs text-muted-foreground italic">Select multiple</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill label="All" selected={selectedStatuses.length === 0} onClick={onClearStatuses} />
            {STATUSES.map(s => (
              <Pill key={s} label={STATUS_LABELS[s]} selected={selectedStatuses.includes(s)} onClick={() => onStatusToggle(s)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown row ───────────────────────────────── */}
      <div className="flex md:hidden items-center gap-2 mb-3 flex-wrap">
        <FilterDropdown
          label="Category"
          options={CATEGORIES}
          getLabel={cat => CAT_LABEL[cat]}
          selected={selectedCategories}
          onToggle={onCategoryToggle}
          onClearAll={onClearCategories}
        />
        <FilterDropdown
          label="Status"
          options={STATUSES}
          getLabel={s => STATUS_LABELS[s]}
          selected={selectedStatuses}
          onToggle={onStatusToggle}
          onClearAll={onClearStatuses}
        />
        {hasActiveFilters && (
          <button onClick={onClearAll} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* ── Active filter chips ───────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCategories.map(cat => (
            <button key={cat} onClick={() => onCategoryToggle(cat)}
              className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-[#EAF3DE] text-[#3B6D11] rounded-full hover:bg-[#d5ebbf] transition-colors">
              {CAT_LABEL[cat]}<X className="w-3 h-3" />
            </button>
          ))}
          {selectedStatuses.map(s => (
            <button key={s} onClick={() => onStatusToggle(s)}
              className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-[#EAF3DE] text-[#3B6D11] rounded-full hover:bg-[#d5ebbf] transition-colors">
              {STATUS_LABELS[s]}<X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* ── Result count ──────────────────────────────────────── */}
      {filteredCount !== totalCount && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} products
        </p>
      )}

    </div>
  )
}
