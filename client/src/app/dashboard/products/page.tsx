'use client'

import { useEffect, useState } from 'react'
import { Plus, Sparkles, Pencil, Trash2 } from 'lucide-react'
import { getProducts, deleteProduct } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { formatCurrency } from '@/lib/currency'
import { AddProductModal } from '@/components/modals/AddProductModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import type { AuthUser } from '@/types/auth'
import type { Product, ProductCategory } from '@/types/catalog'

const CATEGORIES: ProductCategory[] = [
  'COFFEE', 'DAIRY', 'FOOD', 'DISPOSABLES', 'DISHWARE', 'EQUIPMENT', 'FURNITURE', 'CLEANING',
]

const CAT_LABEL: Record<ProductCategory, string> = {
  COFFEE: 'Coffee', DAIRY: 'Dairy', FOOD: 'Food', DISPOSABLES: 'Disposables',
  DISHWARE: 'Dishware', EQUIPMENT: 'Equipment', FURNITURE: 'Furniture', CLEANING: 'Cleaning',
}

export default function ProductsPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [showAI, setShowAI] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { setUser(getAuthUser()) }, [])

  const admin = user ? isAdmin(user) : false

  async function load() {
    setLoading(true)
    try { setProducts(await getProducts()) } catch { /* handled below */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const displayed = activeCategory === 'ALL'
    ? products
    : products.filter(p => p.category === activeCategory)

  async function handleDeleteConfirm() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteProduct(pendingDelete.id)
      setProducts(ps => ps.filter(p => p.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch { /* silently close on error */ setPendingDelete(null) }
    finally { setDeleting(false) }
  }

  function stockColor(p: Product) {
    if (p.stockQuantity === 0) return 'red'
    if (p.stockQuantity <= p.reorderThreshold) return 'amber'
    return 'green'
  }

  const COLS = admin ? 7 : 6

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Products</h1>
        {admin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAI(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #27500A, #3B6D11)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI restock suggestions
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add product
            </button>
          </div>
        )}
      </div>

      {/* AI suggestion card */}
      {showAI && (
        <div className="mb-6 flex items-start gap-3 bg-white border border-gray-200 border-l-4 border-l-[#3B6D11] rounded-lg p-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#3B6D11] mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">Restock suggestions</span>
              <span className="text-[10px] font-semibold text-white bg-[#3B6D11] px-1.5 py-0.5 rounded-full uppercase tracking-wide">AI</span>
              <span className="text-xs text-gray-400">Generated just now</span>
            </div>
            <p className="text-sm text-gray-500">AI restock suggestions will appear here.</p>
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['ALL', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              activeCategory === cat
                ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                : 'text-[#3B6D11] border-[#3B6D11] hover:bg-[#EAF3DE]'
            }`}
          >
            {cat === 'ALL' ? 'All' : CAT_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['SKU', 'Product', 'Category', 'Stock', 'Price', 'Status'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
              {admin && <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: COLS }).map((_, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: j === 1 ? '60%' : '80%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={COLS} className="px-4 py-14 text-center text-sm text-gray-400">
                  {activeCategory === 'ALL' ? 'No products yet.' : `No ${CAT_LABEL[activeCategory as ProductCategory]} products.`}
                </td>
              </tr>
            )}

            {!loading && displayed.map(p => {
              const color = stockColor(p)
              const max = Math.max(p.stockQuantity, p.reorderThreshold, 1)
              const pct = Math.min((p.stockQuantity / max) * 100, 100)
              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-400">{p.sku}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-[220px] truncate">{p.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">{CAT_LABEL[p.category]}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-[70px] h-[5px] bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className={`h-full rounded-full ${color === 'green' ? 'bg-[#3B6D11]' : color === 'amber' ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${color === 'green' ? 'text-[#3B6D11]' : color === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                        {p.stockQuantity}/{p.reorderThreshold}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                    {formatCurrency(p.unitPrice, p.currency)}<span className="text-gray-400">/{p.unit}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {p.stockQuantity === 0
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Out of stock</span>
                      : p.isLowStock
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Low stock</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#3B6D11]">In stock</span>
                    }
                  </td>
                  {admin && (
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(p)}
                          className="p-1.5 text-gray-400 hover:text-[#3B6D11] hover:bg-[#EAF3DE] rounded transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setPendingDelete(p)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />
      )}
      {editing && (
        <AddProductModal product={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load() }} />
      )}
      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete product"
        description={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  )
}
