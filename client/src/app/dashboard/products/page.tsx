'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Plus, Sparkles } from 'lucide-react'
import { getProducts, deleteProduct } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { AddProductModal } from '@/components/modals/AddProductModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { PageHeader } from '@/components/common/PageHeader'
import { ProductsTable } from '@/components/pages/products/ProductsTable'
import { ProductSearchCard } from '@/components/pages/products/ProductSearchCard'
import { ProductFiltersCard, type StockStatus } from '@/components/pages/products/ProductFiltersCard'
import { ProductFiltersMobile } from '@/components/pages/products/ProductFiltersMobile'
import type { Product, ProductCategory } from '@/types/catalog'

type SearchMode = 'name' | 'sku'

export default function ProductsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Filter state — initialized from URL on first render
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>(
    () => (searchParams.get('category') ?? '').split(',').filter(Boolean) as ProductCategory[]
  )
  const [selectedStatuses, setSelectedStatuses] = useState<StockStatus[]>(
    () => (searchParams.get('status') ?? '').split(',').filter(Boolean) as StockStatus[]
  )
  const [searchMode, setSearchMode] = useState<SearchMode>(
    () => (searchParams.get('search') ?? '').includes(',') ? 'sku' : 'name'
  )
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '')
  const [activeSearchFilter, setActiveSearchFilter] = useState(() => searchParams.get('search') ?? '')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const admin = isAdmin(getAuthUser() ?? { roles: [] } as never)
  const skipFirstSync = useRef(true)

  async function load() {
    setLoading(true)
    try { setProducts(await getProducts()) } catch { /* handled */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Sync filter state to URL (skip first render — state already matches URL)
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    const params = new URLSearchParams()
    if (selectedCategories.length) params.set('category', selectedCategories.join(','))
    if (selectedStatuses.length) params.set('status', selectedStatuses.join(','))
    if (activeSearchFilter) params.set('search', activeSearchFilter)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [selectedCategories, selectedStatuses, activeSearchFilter])

  const displayed = useMemo(() =>
    products.filter(product => {
      const matchesSearch = !activeSearchFilter || (() => {
        if (activeSearchFilter.includes(',')) {
          const skus = activeSearchFilter.split(',').map(s => s.trim().toLowerCase())
          return skus.includes(product.sku.toLowerCase())
        }
        return (
          product.name.toLowerCase().includes(activeSearchFilter.toLowerCase()) ||
          product.sku.toLowerCase().includes(activeSearchFilter.toLowerCase())
        )
      })()

      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(product.category)

      const matchesStatus = selectedStatuses.length === 0 ||
        selectedStatuses.some(status => {
          if (status === 'IN_STOCK') return product.stockQuantity > product.reorderThreshold
          if (status === 'LOW_STOCK') return product.stockQuantity > 0 && product.stockQuantity <= product.reorderThreshold
          if (status === 'OUT_OF_STOCK') return product.stockQuantity === 0
          return true
        })

      return matchesSearch && matchesCategory && matchesStatus
    }), [products, activeSearchFilter, selectedCategories, selectedStatuses]
  )

  const skuNotFound = useMemo(() => {
    if (!activeSearchFilter.includes(',')) return []
    const inputSkus = activeSearchFilter.split(',').map(s => s.trim()).filter(Boolean)
    const foundSkus = new Set(products.map(p => p.sku.toLowerCase()))
    return inputSkus.filter(sku => !foundSkus.has(sku.toLowerCase()))
  }, [activeSearchFilter, products])

  function handleSearch() {
    setActiveSearchFilter(searchInput)
  }

  function handleClearSearch() {
    setSearchInput('')
    setActiveSearchFilter('')
  }

  function handleModeChange(mode: SearchMode) {
    setSearchMode(mode)
    setSearchInput('')
    setActiveSearchFilter('')
  }

  function toggleCategory(cat: ProductCategory) {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function toggleStatus(status: StockStatus) {
    setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])
  }

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

  const filterProps = {
    selectedCategories,
    selectedStatuses,
    onCategoryToggle: toggleCategory,
    onStatusToggle: toggleStatus,
    onClearCategories: () => setSelectedCategories([]),
    onClearStatuses: () => setSelectedStatuses([]),
    onClearAll: () => { setSelectedCategories([]); setSelectedStatuses([]) },
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

      <ProductSearchCard
        mode={searchMode}
        inputValue={searchInput}
        onModeChange={handleModeChange}
        onInputChange={setSearchInput}
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      <ProductFiltersCard {...filterProps} />
      <ProductFiltersMobile {...filterProps} />

      <p className="text-xs text-muted-foreground mb-3">
        Showing {displayed.length} of {products.length} products
      </p>
      {skuNotFound.length > 0 && (
        <p className="text-xs text-amber-600 mb-3">
          {skuNotFound.length} of {activeSearchFilter.split(',').filter(s => s.trim()).length} SKUs not found: {skuNotFound.join(', ')}
        </p>
      )}

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
