import type { Supplier } from '@/types/catalog'

const COLORS = ['#3B6D11', '#1d4ed8', '#d97706', '#7c3aed']

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function cityState(address?: string) {
  if (!address) return ''
  const parts = address.split(',')
  return parts.length >= 3 ? `${parts[1].trim()}, ${parts[2].trim()}` : ''
}

interface Props {
  supplier: Supplier
  colorIndex: number
  onView: () => void
}

export function SupplierCard({ supplier: s, colorIndex, onView }: Props) {
  const color = COLORS[colorIndex % COLORS.length]
  const avgLead = s.products.length > 0
    ? Math.round(s.products.reduce((sum, p) => sum + p.leadTimeDays, 0) / s.products.length)
    : 0
  const tags = s.products.slice(0, 3)
  const extra = s.products.length - 3

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: color }}>
            {initials(s.name)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
            {cityState(s.address) && <div className="text-xs text-gray-400 mt-0.5">{cityState(s.address)}</div>}
          </div>
        </div>
        <span className="text-[10px] font-medium text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 rounded-full">Active</span>
      </div>

      {s.contactEmail && <div className="text-xs text-gray-400 mb-3">{s.contactEmail}</div>}

      {s.products.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map(p => (
            <span key={p.productId} className="text-[10px] font-medium text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 rounded-full">
              {p.productName.length > 18 ? p.productName.slice(0, 18) + '…' : p.productName}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">+{extra} more</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {s.products.length} {s.products.length === 1 ? 'product' : 'products'}
          {avgLead > 0 && ` · avg ${avgLead}d lead`}
        </span>
        <button onClick={onView} className="text-xs font-medium text-[#3B6D11] hover:underline">View →</button>
      </div>
    </div>
  )
}
