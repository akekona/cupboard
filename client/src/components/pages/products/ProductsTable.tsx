import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { StatusPill } from '@/components/common/StatusPill'
import { StockBar } from './StockBar'
import { CAT_LABEL } from './CategoryPills'
import type { Product } from '@/types/catalog'

interface Props {
  products: Product[]
  loading?: boolean
  isAdmin: boolean
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
}

export function ProductsTable({ products, loading, isAdmin, onEdit, onDelete }: Props) {
  const cols = isAdmin ? 7 : 6
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ScrollableTable minWidth="750px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['SKU', 'Product', 'Category', 'Stock / Threshold', 'Price', 'Status'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
              {isAdmin && <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <LoadingSkeleton rows={4} cols={cols} />}
            {!loading && products.length === 0 && (
              <tr><td colSpan={cols} className="px-4 py-14 text-center text-sm text-gray-400">No products.</td></tr>
            )}
            {!loading && products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs text-gray-400">{p.sku}</td>
                <td className="px-4 py-3.5">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.description && <div className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{p.description}</div>}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-400">{CAT_LABEL[p.category]}</td>
                <td className="px-4 py-3.5">
                  <StockBar stockQuantity={p.stockQuantity} reorderThreshold={p.reorderThreshold} />
                </td>
                <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                  {formatCurrency(p.unitPrice, p.currency)}<span className="text-gray-400">/{p.unit}</span>
                </td>
                <td className="px-4 py-3.5">
                  {p.stockQuantity === 0
                    ? <StatusPill status="Out of stock" colorClass="bg-red-50 text-red-600" />
                    : p.isLowStock
                      ? <StatusPill status="Low stock" colorClass="bg-amber-50 text-amber-600" />
                      : <StatusPill status="In stock" colorClass="bg-[#EAF3DE] text-[#3B6D11]" />
                  }
                </td>
                {isAdmin && (
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(p)} className="p-1.5 text-gray-400 hover:text-[#3B6D11] hover:bg-[#EAF3DE] rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(p)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTable>
    </div>
  )
}
