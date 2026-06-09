'use client'

import type { OrderStatus } from '@/types/orders'

type Tab = OrderStatus | 'ALL'

const TABS: { value: Tab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'FULFILLED', label: 'Fulfilled' },
]

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  totalElements: number
}

export function OrderStatusTabs({ activeTab, onTabChange, totalElements }: Props) {
  return (
    <div className="flex border-b border-border mb-4 overflow-x-auto">
      {TABS.map(tab => {
        const active = tab.value === activeTab
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`px-4 py-2 text-sm whitespace-nowrap transition-colors cursor-pointer ${
              active
                ? 'text-[#3B6D11] font-medium border-b-2 border-[#3B6D11] mb-[-1px]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {active && totalElements > 0 && (
              <span className="ml-1.5 text-xs text-[#3B6D11]/70">({totalElements})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
