import { SupplierCard } from './SupplierCard'
import type { Supplier } from '@/types/catalog'

interface Props {
  suppliers: Supplier[]
  onView: (id: number) => void
}

export function SuppliersGrid({ suppliers, onView }: Props) {
  if (suppliers.length === 0) {
    return <div className="text-center py-20 text-gray-400 text-sm">No suppliers yet.</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {suppliers.map((s, idx) => (
        <SupplierCard key={s.id} supplier={s} colorIndex={idx} onView={() => onView(s.id)} />
      ))}
    </div>
  )
}
