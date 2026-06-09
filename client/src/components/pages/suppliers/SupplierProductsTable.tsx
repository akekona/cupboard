'use client'

import { useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { setProductSupplierPreferred } from '@/lib/api/catalog'
import { formatCurrency } from '@/lib/currency'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { StatusPill } from '@/components/common/StatusPill'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { SupplierProductInfo } from '@/types/catalog'

interface Props {
  products: SupplierProductInfo[]
  isAdmin: boolean
}

export function SupplierProductsTable({ products: initialProducts, isAdmin }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(ps: SupplierProductInfo) {
    const next = !ps.isPreferred

    // Optimistic update
    setProducts(prev => prev.map(p => p.id === ps.id ? { ...p, isPreferred: next } : p))
    setLoadingIds(prev => new Set(prev).add(ps.id))

    try {
      await setProductSupplierPreferred(ps.id, next)
    } catch {
      // Revert
      setProducts(prev => prev.map(p => p.id === ps.id ? { ...p, isPreferred: ps.isPreferred } : p))
      setError('Failed to update preferred supplier')
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(ps.id); return s })
    }
  }

  return (
    <>
      {error && (
        <div className="mx-5 mt-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          {error}
        </div>
      )}
      <ScrollableTable minWidth="500px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Product', 'SKU', 'Our cost', 'Lead time', 'Preferred'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-900">{p.productName}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-400">{p.sku}</td>
                <td className="px-5 py-3 text-gray-700">{formatCurrency(p.costPrice, p.currency)}</td>
                <td className="px-5 py-3 text-gray-600">{p.leadTimeDays} day{p.leadTimeDays !== 1 ? 's' : ''}</td>
                <td className="px-5 py-3">
                  {isAdmin ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleToggle(p)}
                          disabled={loadingIds.has(p.id)}
                          className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50"
                        >
                          {loadingIds.has(p.id) ? (
                            <Loader2 size={15} className="animate-spin text-muted-foreground" />
                          ) : p.isPreferred ? (
                            <>
                              <Star size={15} fill="#3B6D11" className="text-[#3B6D11]" />
                              <span className="text-xs font-medium text-[#3B6D11]">Preferred</span>
                            </>
                          ) : (
                            <Star size={15} className="text-muted-foreground" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {p.isPreferred ? 'Click to remove as preferred supplier' : 'Click to set as preferred supplier'}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    p.isPreferred && <StatusPill status="Preferred" colorClass="bg-[#EAF3DE] text-[#3B6D11]" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTable>
      <p className="px-5 py-2 text-xs text-muted-foreground">
        ★ Preferred supplier is used as the default source for AI restock suggestions
      </p>
    </>
  )
}
