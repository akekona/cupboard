'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Pencil, Trash2, Star, Loader2, AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'
import { getProductById, deleteProduct, setProductSupplierPreferred } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { formatCurrency, fromSmallestUnit } from '@/lib/currency'
import { AddProductModal } from '@/components/modals/AddProductModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { NotFound } from '@/components/common/NotFound'
import { StatusPill } from '@/components/common/StatusPill'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Product, ProductSupplierInfo } from '@/types/catalog'

const CATEGORY_COLORS: Record<string, string> = {
  COFFEE: 'bg-amber-100 text-amber-700',
  DAIRY: 'bg-blue-100 text-blue-700',
  FOOD: 'bg-orange-100 text-orange-700',
  DISPOSABLES: 'bg-gray-100 text-gray-600',
  DISHWARE: 'bg-cyan-100 text-cyan-700',
  EQUIPMENT: 'bg-purple-100 text-purple-700',
  FURNITURE: 'bg-stone-100 text-stone-700',
  CLEANING: 'bg-teal-100 text-teal-700',
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  )
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [admin, setAdmin] = useState(false)

  const [product, setProduct] = useState<Product | null>(null)
  const [suppliers, setSuppliers] = useState<ProductSupplierInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [starLoadingIds, setStarLoadingIds] = useState<Set<number>>(new Set())
  const [starError, setStarError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const p = await getProductById(Number(id))
      setProduct(p)
      setSuppliers(p.suppliers)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setAdmin(isAdmin(getAuthUser() ?? { roles: [] } as never)) }, [])
  useEffect(() => { load() }, [id])

  async function handleDelete() {
    if (!product) return
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      router.push('/dashboard/products')
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleStarToggle(ps: ProductSupplierInfo) {
    const next = !ps.isPreferred
    setSuppliers(prev => prev.map(s => s.id === ps.id ? { ...s, isPreferred: next } : s))
    setStarLoadingIds(prev => new Set(prev).add(ps.id))
    try {
      await setProductSupplierPreferred(ps.id, next)
    } catch {
      setSuppliers(prev => prev.map(s => s.id === ps.id ? { ...s, isPreferred: ps.isPreferred } : s))
      setStarError('Failed to update preferred supplier')
      setTimeout(() => setStarError(null), 4000)
    } finally {
      setStarLoadingIds(prev => { const s = new Set(prev); s.delete(ps.id); return s })
    }
  }

  if (notFound) {
    return (
      <div className="page-container">
        <NotFound
          title="Product not found"
          description="This product doesn't exist or has been deleted."
          backHref="/dashboard/products"
          backLabel="Back to products"
        />
      </div>
    )
  }

  const isOut = (product?.stockQuantity ?? 0) === 0
  const isLow = !isOut && (product?.isLowStock ?? false)
  const stockPct = product
    ? Math.min(100, (product.stockQuantity / (Math.max(product.reorderThreshold * 2, product.stockQuantity, 1))) * 100)
    : 0
  const barColor = isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-[#3B6D11]'
  const stockStatus = isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'
  const stockPillColor = isOut
    ? 'bg-red-100 text-red-700'
    : isLow
    ? 'bg-amber-100 text-amber-700'
    : 'bg-[#EAF3DE] text-[#3B6D11]'

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/dashboard/products')} className="hover:text-gray-600">
          Products
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">
          {product?.name ?? (loading ? '…' : '—')}
        </span>
      </div>

      {/* Header */}
      {loading ? (
        <div className="mb-6 space-y-2">
          <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : product ? (
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-sm text-muted-foreground font-mono">{product.sku}</span>
              <StatusPill
                status={product.category.charAt(0) + product.category.slice(1).toLowerCase()}
                colorClass={CATEGORY_COLORS[product.category] ?? 'bg-gray-100 text-gray-600'}
              />
            </div>
          </div>
          {admin && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit product
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete product
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Body */}
      {loading ? (
        <div className="flex gap-6 flex-col lg:flex-row items-start">
          <div className="flex-1 w-full space-y-4">
            {[5, 4].map((rows, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                {Array.from({ length: rows }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j % 2 === 0 ? '60%' : '80%' }} />
                ))}
              </div>
            ))}
          </div>
          <div className="w-full lg:w-[280px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j % 2 === 0 ? '70%' : '90%' }} />
            ))}
          </div>
        </div>
      ) : product ? (
        <div className="flex gap-6 flex-col lg:flex-row items-start">

          {/* Left column */}
          <div className="flex-1 w-full space-y-4 min-w-0">

            {/* Details card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</h2>
              <DetailRow
                label="Description"
                value={product.description
                  ? <span className="whitespace-pre-wrap">{product.description}</span>
                  : <span className="text-muted-foreground">No description</span>}
              />
              <DetailRow label="Unit" value={product.unit} />
              <DetailRow label="Currency" value={product.currency} />
              <DetailRow
                label="Unit price"
                value={`${formatCurrency(product.unitPrice, product.currency)} per ${product.unit}`}
              />
              <DetailRow label="Created" value={formatDate(product.createdAt)} />
            </div>

            {/* Inventory card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory</h2>

              {/* Stock bar */}
              <div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${stockPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">
                    {product.stockQuantity} / {product.reorderThreshold} units
                  </span>
                  <StatusPill status={stockStatus} colorClass={stockPillColor} />
                </div>
              </div>

              <DetailRow
                label="Reorder threshold"
                value={`Reorder when below ${product.reorderThreshold} units`}
              />

              {(isLow || isOut) && (
                <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm ${
                  isOut
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {isOut
                    ? <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <div>
                    <div className="font-medium">
                      {isOut ? 'Out of stock' : 'Stock is below reorder threshold'}
                    </div>
                    {admin && (
                      <Link
                        href="/dashboard/products?status=LOW_STOCK"
                        className="text-xs underline underline-offset-2 mt-0.5 inline-block opacity-80 hover:opacity-100"
                      >
                        View AI restock suggestions →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column — suppliers */}
          <div className="w-full lg:w-[280px] flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suppliers</h2>
              </div>

              {starError && (
                <div className="mx-4 mt-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
                  {starError}
                </div>
              )}

              {suppliers.length === 0 ? (
                <div className="px-5 py-8 text-center space-y-1">
                  <p className="text-sm text-gray-500">No suppliers linked to this product</p>
                  <p className="text-xs text-muted-foreground">Add suppliers from the Suppliers page</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {suppliers.map(ps => (
                    <div key={ps.id} className="px-5 py-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/dashboard/suppliers/${ps.supplierId}`}
                          className={`text-sm font-medium hover:underline truncate ${
                            ps.isPreferred ? 'text-[#3B6D11]' : 'text-gray-900'
                          }`}
                        >
                          {ps.supplierName}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {ps.isPreferred && (
                            <StatusPill status="Preferred" colorClass="bg-[#EAF3DE] text-[#3B6D11]" />
                          )}
                          {admin && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleStarToggle(ps)}
                                  disabled={starLoadingIds.has(ps.id)}
                                  className="flex items-center transition-colors disabled:opacity-50"
                                >
                                  {starLoadingIds.has(ps.id) ? (
                                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                                  ) : ps.isPreferred ? (
                                    <Star size={14} fill="#3B6D11" className="text-[#3B6D11]" />
                                  ) : (
                                    <Star size={14} className="text-muted-foreground" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {ps.isPreferred ? 'Remove as preferred' : 'Set as preferred'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatCurrency(ps.costPrice, ps.currency)}</span>
                        <span>·</span>
                        <span>{ps.leadTimeDays} day{ps.leadTimeDays !== 1 ? 's' : ''} lead</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-5 py-3 border-t border-gray-50">
                <p className="text-xs text-muted-foreground">
                  ★ Preferred supplier used for AI restock suggestions
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : null}

      {editing && product && (
        <AddProductModal
          product={product}
          onClose={() => setEditing(false)}
          onSuccess={() => { setEditing(false); load() }}
        />
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete product"
        description={`Are you sure you want to delete "${product?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  )
}
