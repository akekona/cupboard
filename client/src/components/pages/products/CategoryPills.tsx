import type { ProductCategory } from '@/types/catalog'

const CAT_LABEL: Record<ProductCategory, string> = {
  COFFEE: 'Coffee', DAIRY: 'Dairy', FOOD: 'Food', DISPOSABLES: 'Disposables',
  DISHWARE: 'Dishware', EQUIPMENT: 'Equipment', FURNITURE: 'Furniture', CLEANING: 'Cleaning',
}

const CATEGORIES: ProductCategory[] = [
  'COFFEE', 'DAIRY', 'FOOD', 'DISPOSABLES', 'DISHWARE', 'EQUIPMENT', 'FURNITURE', 'CLEANING',
]

interface Props {
  selected: ProductCategory | 'ALL'
  onChange: (cat: ProductCategory | 'ALL') => void
}

export function CategoryPills({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {(['ALL', ...CATEGORIES] as const).map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
            selected === cat
              ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
              : 'text-[#3B6D11] border-[#3B6D11] hover:bg-[#EAF3DE]'
          }`}
        >
          {cat === 'ALL' ? 'All' : CAT_LABEL[cat]}
        </button>
      ))}
    </div>
  )
}

export { CAT_LABEL, CATEGORIES }
