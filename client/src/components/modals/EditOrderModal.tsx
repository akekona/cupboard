'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import { Modal } from './Modal'
import { InputLabelText } from '@/components/ui/typography'
import { getProducts } from '@/lib/api/catalog'
import { updateOrder } from '@/lib/api/orders'
import { formatCurrency } from '@/lib/currency'
import type { Product, ProductCategory } from '@/types/catalog'
import type { Order } from '@/types/orders'

const CATEGORIES: ProductCategory[] = [
  'COFFEE', 'DAIRY', 'FOOD', 'DISPOSABLES', 'DISHWARE', 'EQUIPMENT', 'FURNITURE', 'CLEANING',
]
const CAT_LABEL: Record<ProductCategory, string> = {
  COFFEE: 'Coffee', DAIRY: 'Dairy', FOOD: 'Food', DISPOSABLES: 'Disposables',
  DISHWARE: 'Dishware', EQUIPMENT: 'Equipment', FURNITURE: 'Furniture', CLEANING: 'Cleaning',
}

interface Props {
  order: Order
  onClose: () => void
  onSuccess: () => void
}

export function EditOrderModal({ order, onClose, onSuccess }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map())
  const [needBy, setNeedBy] = useState(order.needBy ?? '')
  const [notes, setNotes] = useState(order.notes ?? '')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory>('COFFEE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProducts({ size: 1000 }).then(r => {
      setProducts(r.content)
      const map = new Map<number, number>()
      for (const item of order.items) {
        map.set(item.productId, item.quantity)
      }
      setSelectedItems(map)
    })
  }, [])

  function setQty(productId: number, qty: number) {
    setSelectedItems(prev => {
      const next = new Map(prev)
      if (qty <= 0) next.delete(productId)
      else next.set(productId, qty)
      return next
    })
  }

  const filteredProducts = products
    .filter(p => p.category === category)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const selectedList = products.filter(p => (selectedItems.get(p.id) ?? 0) > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedList.length === 0) { setError('Add at least one item.'); return }
    setSaving(true)
    setError(null)
    try {
      await updateOrder(order.id, {
        needBy: needBy || undefined,
        notes: notes || undefined,
        items: selectedList.map(p => ({ productId: p.id, quantity: selectedItems.get(p.id)! })),
      })
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Edit order #${order.id}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Dates + notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <InputLabelText>Need by</InputLabelText>
            <input type="date" value={needBy} onChange={e => setNeedBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]" />
          </div>
          <div>
            <InputLabelText>Notes</InputLabelText>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]" />
          </div>
        </div>

        {/* Product selection */}
        <div>
          <InputLabelText className="mb-2">Items</InputLabelText>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="pl-8 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full border transition-colors ${
                  category === cat
                    ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                    : 'text-[#3B6D11] border-[#3B6D11] hover:bg-[#EAF3DE]'
                }`}>
                {CAT_LABEL[cat]}
              </button>
            ))}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {filteredProducts.map(p => {
              const qty = selectedItems.get(p.id) ?? 0
              const outOfStock = p.stockQuantity === 0
              return (
                <div key={p.id} className={`flex items-center justify-between px-3 py-2.5 border-b border-gray-50 last:border-0 ${outOfStock ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{formatCurrency(p.unitPrice, p.currency)}/{p.unit}</div>
                  </div>
                  <div className="flex flex-col items-end ml-3 flex-shrink-0">
                    {qty === 0 ? (
                      <button type="button" onClick={() => !outOfStock && setQty(p.id, 1)} disabled={outOfStock}
                        className="h-5 px-2 text-[10px] font-medium text-[#3B6D11] border border-[#3B6D11] rounded hover:bg-[#EAF3DE] disabled:opacity-40 disabled:cursor-not-allowed">
                        + Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setQty(p.id, qty - 1)}
                          className="w-5 h-5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center">
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={e => {
                            const v = e.target.value
                            if (v === '' || v === '0') { setQty(p.id, 0); return }
                            const n = parseInt(v, 10)
                            if (!isNaN(n) && n > 0) setQty(p.id, Math.min(p.stockQuantity, n))
                          }}
                          className="w-10 text-center text-xs font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6D11]/40"
                        />
                        <button type="button" onClick={() => setQty(p.id, Math.min(p.stockQuantity, qty + 1))}
                          disabled={outOfStock || qty >= p.stockQuantity}
                          className="w-5 h-5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                    <span className={`text-[10px] text-amber-600 leading-none mt-0.5 ${qty > 0 && qty >= p.stockQuantity ? '' : 'invisible'}`}>
                      Max: {p.stockQuantity}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected summary */}
        {selectedList.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            {selectedList.map(p => (
              <div key={p.id} className="flex justify-between text-xs text-gray-600">
                <span>{p.name} ×{selectedItems.get(p.id)}</span>
                <span className="font-medium">{formatCurrency((selectedItems.get(p.id) ?? 0) * p.unitPrice, p.currency)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
