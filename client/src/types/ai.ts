export interface RestockSuggestionItem {
  productId: number
  productName: string
  sku: string
  currentStock: number
  reorderThreshold: number
  urgency: 'CRITICAL' | 'LOW'
  supplierName: string | null
  leadTimeDays: number | null
  suggestedQty: number
  estimatedCost: number | null
  note: string
}

export interface RestockSuggestionsResponse {
  summary: string
  items: RestockSuggestionItem[]
}
