import { api } from '@/lib/api'
import type {
  Product,
  Supplier,
  ClientSummary,
  ClientDetail,
} from '@/types/catalog'

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise
  if (!res.success) throw new Error(res.message ?? 'Request failed')
  return res.data
}

// ── Products ──────────────────────────────────────────────────────────────────

export const getProducts = () =>
  unwrap(api.get<ApiResponse<Product[]>>('/api/products'))

export const getLowStockProducts = () =>
  unwrap(api.get<ApiResponse<Product[]>>('/api/products/low-stock'))

export const getProductById = (id: number) =>
  unwrap(api.get<ApiResponse<Product>>(`/api/products/${id}`))

export const createProduct = (data: Record<string, unknown>) =>
  unwrap(api.post<ApiResponse<Product>>('/api/products', data))

export const updateProduct = (id: number, data: Record<string, unknown>) =>
  unwrap(api.put<ApiResponse<Product>>(`/api/products/${id}`, data))

export const deleteProduct = (id: number) =>
  api.delete<void>(`/api/products/${id}`)

// ── Suppliers ─────────────────────────────────────────────────────────────────

export const getSuppliers = () =>
  unwrap(api.get<ApiResponse<Supplier[]>>('/api/suppliers'))

export const getSupplierById = (id: number) =>
  unwrap(api.get<ApiResponse<Supplier>>(`/api/suppliers/${id}`))

export const createSupplier = (data: Record<string, unknown>) =>
  unwrap(api.post<ApiResponse<Supplier>>('/api/suppliers', data))

export const updateSupplier = (id: number, data: Record<string, unknown>) =>
  unwrap(api.put<ApiResponse<Supplier>>(`/api/suppliers/${id}`, data))

// ── Clients ───────────────────────────────────────────────────────────────────

export const getClients = () =>
  unwrap(api.get<ApiResponse<ClientSummary[]>>('/api/clients'))

export const getClientById = (id: number) =>
  unwrap(api.get<ApiResponse<ClientDetail>>(`/api/clients/${id}`))

export const createClient = (data: Record<string, unknown>) =>
  unwrap(api.post<ApiResponse<ClientDetail>>('/api/clients', data))

export const updateClient = (id: number, data: Record<string, unknown>) =>
  unwrap(api.put<ApiResponse<ClientDetail>>(`/api/clients/${id}`, data))

export const suspendClient = (id: number) =>
  api.patch<void>(`/api/clients/${id}/suspend`, {})

export const reactivateClient = (id: number) =>
  api.patch<void>(`/api/clients/${id}/reactivate`, {})
