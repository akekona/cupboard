'use client'

import { useEffect, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { getProducts, deleteProduct } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { AddProductModal } from '@/components/modals/AddProductModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { PageHeader } from '@/components/common/PageHeader'
import { CategoryPills } from '@/components/pages/products/CategoryPills'
import { ProductsTable } from '@/components/pages/products/ProductsTable'
import type { Product, ProductCategory } from '@/types/catalog'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [showAI, setShowAI] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const admin = isAdmin(getAuthUser() ?? { roles: [] } as never)

  async function load() {
    setLoading(true)
    try { setProducts(await getProducts()) } catch { /* handled */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const displayed = activeCategory === 'ALL' ? products : products.filter(p => p.category === activeCategory)

  async function handleDeleteConfirm() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteProduct(pendingDelete.id)
      setProducts(ps => ps.filter(p => p.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch { setPendingDelete(null) }
    finally { setDeleting(false) }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Products"
        actions={admin ? (
          <>
            <button onClick={() => setShowAI(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #27500A, #3B6D11)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI restock suggestions</span>
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add product</span>
            </button>
          </>
        ) : undefined}
      />

      {showAI && (
        <div className="mb-6 flex items-start gap-3 bg-white border border-gray-200 border-l-4 border-l-[#3B6D11] rounded-lg p-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#3B6D11] mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">Restock suggestions</span>
              <span className="text-[10px] font-semibold text-white bg-[#3B6D11] px-1.5 py-0.5 rounded-full uppercase tracking-wide">AI</span>
            </div>
            <p className="text-sm text-gray-500">AI restock suggestions will appear here.</p>
          </div>
        </div>
      )}

      <CategoryPills selected={activeCategory} onChange={setActiveCategory} />

      <ProductsTable
        products={displayed}
        loading={loading}
        isAdmin={admin}
        onEdit={setEditing}
        onDelete={setPendingDelete}
      />

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />}
      {editing && <AddProductModal product={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load() }} />}
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
