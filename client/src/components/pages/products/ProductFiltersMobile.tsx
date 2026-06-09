'use client'

import { Popover } from 'radix-ui'
import { ChevronDown, CheckSquare, Square } from 'lucide-react'
import type { ProductCategory } from '@/types/catalog'
import { CAT_LABEL, CATEGORIES } from './CategoryPills'
import { type StockStatus, STATUS_LABELS, STATUSES } from './ProductFiltersCard'

interface Props {
  selectedCategories: ProductCategory[]
  selectedStatuses: StockStatus[]
  onCategoryToggle: (cat: ProductCategory) => void
  onStatusToggle: (status: StockStatus) => void
  onClearCategories: () => void
  onClearStatuses: () => void
  onClearAll: () => void
}

function OptionRow({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent text-left ${
        checked ? 'text-[#3B6D11]' : 'text-foreground'
      }`}
    >
      {checked
        ? <CheckSquare size={14} className="text-[#3B6D11] flex-shrink-0" />
        : <Square size={14} className="text-muted-foreground flex-shrink-0" />
      }
      <span className="text-sm">{label}</span>
    </button>
  )
}

function FilterPopover<T extends string>({
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
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-muted transition-colors">
          {label}{selected.length > 0 && ` (${selected.length})`}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={5}
          align="start"
          className="w-48 bg-background border border-border rounded-md shadow-lg z-50 p-1 focus:outline-none"
        >
          <OptionRow label="All" checked={selected.length === 0} onClick={onClearAll} />
          {options.map(opt => (
            <OptionRow
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

export function ProductFiltersMobile({
  selectedCategories,
  selectedStatuses,
  onCategoryToggle,
  onStatusToggle,
  onClearCategories,
  onClearStatuses,
  onClearAll,
}: Props) {
  const hasActiveFilters = selectedCategories.length > 0 || selectedStatuses.length > 0

  return (
    <div className="flex gap-2 md:hidden mb-3 flex-wrap">
      <FilterPopover
        label="Category"
        options={CATEGORIES}
        getLabel={cat => CAT_LABEL[cat]}
        selected={selectedCategories}
        onToggle={onCategoryToggle}
        onClearAll={onClearCategories}
      />
      <FilterPopover
        label="Status"
        options={STATUSES}
        getLabel={s => STATUS_LABELS[s]}
        selected={selectedStatuses}
        onToggle={onStatusToggle}
        onClearAll={onClearStatuses}
      />
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
