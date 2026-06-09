'use client'

import { Search, X } from 'lucide-react'

type SearchMode = 'name' | 'sku'

interface Props {
  mode: SearchMode
  inputValue: string
  onModeChange: (mode: SearchMode) => void
  onInputChange: (val: string) => void
  onSearch: () => void
  onClear: () => void
}

export function ProductSearchCard({ mode, inputValue, onModeChange, onInputChange, onSearch, onClear }: Props) {
  return (
    <div className="bg-background border border-border rounded-lg p-4 mb-3">
      {/* Mode switcher */}
      <div className="mb-3">
        <span className="text-sm font-medium text-muted-foreground mr-1.5">Search by:</span>
        <span
          onClick={() => mode !== 'name' && onModeChange('name')}
          className={
            mode === 'name'
              ? 'text-sm font-medium text-foreground'
              : 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
          }
        >
          Product name
        </span>
        <span className="text-muted-foreground/40 mx-2 select-none">|</span>
        <span
          onClick={() => mode !== 'sku' && onModeChange('sku')}
          className={
            mode === 'sku'
              ? 'text-sm font-medium text-foreground'
              : 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
          }
        >
          SKU
        </span>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder={mode === 'name' ? 'e.g. Oat milk, Ethiopian...' : 'e.g. COF-ETH-1KG, DAI-OAT-C12...'}
            className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] transition-colors"
          />
          {inputValue && (
            <button
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <button
          onClick={onSearch}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-md hover:bg-[#2f5a0e] transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </div>

      {/* Hint */}
      <p className={`mt-2 text-xs ${mode === 'sku' ? 'text-[#3B6D11]' : 'text-muted-foreground italic'}`}>
        {mode === 'name' ? 'Press Enter or click Search to filter' : 'Comma-separate for multiple SKUs'}
      </p>
    </div>
  )
}
