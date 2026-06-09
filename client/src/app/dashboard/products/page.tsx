'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Plus, Sparkles } from 'lucide-react'
import { getProducts, deleteProduct } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { AddProductModal } from '@/components/modals/AddProductModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { ProductsTable } from '@/components/pages/products/ProductsTable'
import { ProductSearchCard } from '@/components/pages/products/ProductSearchCard'
import { ProductFiltersCard, type StockStatus } from '@/components/pages/products/ProductFiltersCard'
import { ProductFiltersMobile } from '@/components/pages/products/ProductFiltersMobile'
import type { Product, ProductCategory } from '@/types/catalog'
import type { PagedResponse } from '@/types/common'

type SearchMode = 'name' | 'sku'

const PAGE_SIZE = 50

export default function ProductsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>(
    () => (searchParams.get('category') ?? '').split(',').filter(Boolean) as ProductCategory[]
  )
  const [selectedStatuses, setSelectedStatuses] = useState<StockStatus[]>(
    () => (searchParams.get('status') ?? '').split(',').filter(Boolean) as StockStatus[]
  )
  const [searchMode, setSearchMode] = useState<SearchMode>(
    () => (searchParams.get('search') ?? '').includes(',') ? 'sku' : 'name'
  )
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') ?? '')
  const [activeSearch, setActiveSearch] = useState(() => searchParams.get('search') ?? '')
  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get('page') ?? 0))

  const [pagedData, setPagedData] = useState<PagedResponse<Product> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [version, setVersion] = useState(0)
  const [admin, setAdmin] = useState(false)

  useEffect(() => { setAdmin(isAdmin(getAuthUser() ?? { roles: [] } as never)) }, [])
  const skipFirstSync = useRef(true)

  // Fetch whenever filter state or page changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    const isSkuMode = activeSearch.includes(',')
    getProducts({
      search: isSkuMode ? undefined : (activeSearch || undefined),
      category: selectedCategories.length ? selectedCategories : undefined,
      status: selectedStatuses.length ? selectedStatuses : undefined,
      skus: isSkuMode ? activeSearch.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      page: currentPage,
      size: PAGE_SIZE,
    })
      .then(data => { if (!cancelled) setPagedData(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [currentPage, selectedCategories, selectedStatuses, activeSearch, version])

  // Sync filter + page state to URL (skip first render)
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    const params = new URLSearchParams()
    if (selectedCategories.length) params.set('category', selectedCategories.join(','))
    if (selectedStatuses.length) params.set('status', selectedStatuses.join(','))
    if (activeSearch) params.set('search', activeSearch)
    if (currentPage > 0) params.set('page', String(currentPage))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [selectedCategories, selectedStatuses, activeSearch, currentPage])

  const skuNotFound = useMemo(() => {
    if (!activeSearch.includes(',') || !pagedData) return []
    const inputSkus = activeSearch.split(',').map(s => s.trim()).filter(Boolean)
    const foundSkus = new Set(pagedData.content.map(p => p.sku.toLowerCase()))
    return inputSkus.filter(sku => !foundSkus.has(sku.toLowerCase()))
  }, [activeSearch, pagedData])

  function handleSearch() {
    setActiveSearch(inputValue)
    setCurrentPage(0)
  }

  function handleClearSearch() {
    setInputValue('')
    setActiveSearch('')
    setCurrentPage(0)
  }

  function handleModeChange(mode: SearchMode) {
    setSearchMode(mode)
    setInputValue('')
    setActiveSearch('')
    setCurrentPage(0)
  }

  function toggleCategory(cat: ProductCategory) {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
    setCurrentPage(0)
  }

  function toggleStatus(status: StockStatus) {
    setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])
    setCurrentPage(0)
  }

  function clearFilters() {
    setSelectedCategories([])
    setSelectedStatuses([])
    setCurrentPage(0)
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteProduct(pendingDelete.id)
      setPendingDelete(null)
      setVersion(v => v + 1)
    } catch { setPendingDelete(null) }
    finally { setDeleting(false) }
  }

  const filterProps = {
    selectedCategories,
    selectedStatuses,
    onCategoryToggle: toggleCategory,
    onStatusToggle: toggleStatus,
    onClearCategories: () => { setSelectedCategories([]); setCurrentPage(0) },
    onClearStatuses: () => { setSelectedStatuses([]); setCurrentPage(0) },
    onClearAll: clearFilters,
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
        inputValue={inputValue}
        onModeChange={handleModeChange}
        onInputChange={setInputValue}
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      <ProductFiltersCard {...filterProps} />
      <ProductFiltersMobile {...filterProps} />

      {/* Result count + SKU warning */}
      <div className="mb-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          Showing {pagedData?.totalElements ?? 0} products
        </p>
        {skuNotFound.length > 0 && (
          <p className="text-xs text-amber-600">
            {skuNotFound.length} of {activeSearch.split(',').filter(s => s.trim()).length} SKUs not found: {skuNotFound.join(', ')}
          </p>
        )}
      </div>

      <ProductsTable
        products={pagedData?.content ?? []}
        loading={isLoading}
        isAdmin={admin}
        onEdit={setEditing}
        onDelete={setPendingDelete}
      />

      {pagedData && pagedData.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagedData.totalPages}
          totalElements={pagedData.totalElements}
          pageSize={pagedData.pageSize}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); setVersion(v => v + 1) }} />}
      {editing && <AddProductModal product={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); setVersion(v => v + 1) }} />}
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
