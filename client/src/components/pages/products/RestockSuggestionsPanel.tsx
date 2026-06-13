'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { getRestockSuggestions } from '@/lib/api/catalog'

export function RestockSuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<string | null>(null)
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

  return (
    <div className="mb-6 flex items-start gap-3 bg-white border border-gray-200 border-l-4 border-l-[#3B6D11] rounded-lg p-4 shadow-sm">
      <Sparkles className="w-4 h-4 text-[#3B6D11] mt-0.5 flex-shrink-0" />
      <div>
        <div className="flex items-center gap-2 mb-1">
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
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{suggestions}</p>
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
