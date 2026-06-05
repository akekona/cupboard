import type { CurrencyCode } from '@/lib/currency'

export type ProductCategory =
  | 'COFFEE' | 'DAIRY' | 'FOOD' | 'DISPOSABLES'
  | 'DISHWARE' | 'EQUIPMENT' | 'FURNITURE' | 'CLEANING'

export interface Product {
  id: number
  sku: string
  name: string
  description?: string
  category: ProductCategory
  unitPrice: number
  currency: CurrencyCode
  unit: string
  stockQuantity: number
  reorderThreshold: number
  isLowStock: boolean
  deletedAt?: string
  suppliers: ProductSupplierInfo[]
}

export interface ProductSupplierInfo {
  id: number
  supplierName: string
  costPrice: number
  currency: CurrencyCode
  leadTimeDays: number
  isPreferred: boolean
}

export interface Supplier {
  id: number
  name: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  notes?: string
  deletedAt?: string
  products: SupplierProductInfo[]
}

export interface SupplierProductInfo {
  productId: number
  productName: string
  sku: string
  costPrice: number
  currency: CurrencyCode
  leadTimeDays: number
  isPreferred: boolean
}

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export interface ClientSummary {
  id: number
  name: string
  accountStatus: AccountStatus
  contactName?: string
  contactEmail?: string
  orderCount: number
  totalSpend: number
  outstandingBalance: number
}

export interface ClientDetail extends ClientSummary {
  contactPhone?: string
  address?: string
  recentOrders: OrderSummary[]
}

export interface OrderSummary {
  id: number
  status: string
  totalAmount: number
  currency: CurrencyCode
  createdAt: string
}
