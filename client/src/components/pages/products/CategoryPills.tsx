import type { ProductCategory } from '@/types/catalog'

export const CAT_LABEL: Record<ProductCategory, string> = {
  COFFEE: 'Coffee', DAIRY: 'Dairy', FOOD: 'Food', DISPOSABLES: 'Disposables',
  DISHWARE: 'Dishware', EQUIPMENT: 'Equipment', FURNITURE: 'Furniture', CLEANING: 'Cleaning',
}

export const CATEGORIES: ProductCategory[] = [
  'COFFEE', 'DAIRY', 'FOOD', 'DISPOSABLES', 'DISHWARE', 'EQUIPMENT', 'FURNITURE', 'CLEANING',
]
