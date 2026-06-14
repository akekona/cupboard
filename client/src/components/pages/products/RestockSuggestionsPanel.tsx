'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { getRestockSuggestions } from '@/lib/api/catalog'
import { formatCurrency } from '@/lib/currency'
import type { RestockSuggestionItem, RestockSuggestionsResponse } from '@/types/ai'

function SuggestionCard({ item }: { item: RestockSuggestionItem }) {
  const isCritical = item.urgency === 'CRITICAL'
  return (
    <div className={`border-l-4 ${isCritical ? 'border-red-500' : 'border-amber-500'} bg-gray-50 rounded-r-lg p-3 mb-2`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-gray-900">{item.productName}</span>
        {item.currentStock === 0 ? (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">OUT OF STOCK</span>
        ) : (
          <span className="text-sm text-gray-600">{item.currentStock} / {item.reorderThreshold}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        {item.supplierName
          ? `${item.supplierName}${item.leadTimeDays != null ? ` · ${item.leadTimeDays} day lead time` : ''}`
          : 'No supplier linked'}
      </p>
      <p className="text-sm text-gray-700 mt-1">{item.note}</p>
      {item.estimatedCost != null && (
        <p className="text-xs text-gray-600 mt-1 font-medium">
          Suggest ordering {item.suggestedQty} units (~{formatCurrency(item.estimatedCost, 'USD')})
        </p>
      )}
    </div>
  )
}

export function RestockSuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<RestockSuggestionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function fetchSuggestions() {
    setLoading(true)
    setError(false)
    getRestockSuggestions()
      .then(setSuggestions)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSuggestions() }, [])

  const criticalItems = (suggestions?.items.filter(i => i.urgency === 'CRITICAL') ?? [])
    .sort((a, b) => a.currentStock - b.currentStock)
  const lowItems = suggestions?.items.filter(i => i.urgency === 'LOW') ?? []

  return (
    <div className="mb-6 flex items-start gap-3 bg-white border border-gray-200 border-l-4 border-l-[#3B6D11] rounded-lg p-4 shadow-sm">
      <Sparkles className="w-4 h-4 text-[#3B6D11] mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-900">Restock suggestions</span>
          <span className="text-[10px] font-semibold text-white bg-[#3B6D11] px-1.5 py-0.5 rounded-full uppercase tracking-wide">AI</span>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-gray-500">Unable to load suggestions right now.</p>
        )}

        {!loading && !error && suggestions && (
          <>
            <p className="text-sm font-medium text-gray-900 mb-2">{suggestions.summary}</p>

            {suggestions.items.length === 0 ? (
              <p className="text-sm text-gray-500">All products are well stocked. No restock needed.</p>
            ) : (
              <>
                {criticalItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mt-3 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Critical · {criticalItems.length}
                      </span>
                    </div>
                    {criticalItems.map(item => <SuggestionCard key={item.sku} item={item} />)}
                  </div>
                )}
                {lowItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mt-3 mb-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Low stock · {lowItems.length}
                      </span>
                    </div>
                    {lowItems.map(item => <SuggestionCard key={item.sku} item={item} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!loading && (
          <button
            onClick={fetchSuggestions}
            className="mt-3 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-md hover:border-gray-300 hover:text-gray-700"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        )}
      </div>
    </div>
  )
}
