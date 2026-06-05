'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Pencil } from 'lucide-react'
import { getSupplierById } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { formatCurrency } from '@/lib/currency'
import { AddSupplierModal } from '@/components/modals/AddSupplierModal'
import type { AuthUser } from '@/types/auth'
import type { Supplier } from '@/types/catalog'

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => { setUser(getAuthUser()) }, [])

  async function load() {
    setLoading(true)
    try {
      setSupplier(await getSupplierById(Number(id)))
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const admin = user ? isAdmin(user) : false

  if (notFound) {
    return (
      <div className="p-8 text-center py-20">
        <p className="text-gray-400 text-sm mb-3">Supplier not found.</p>
        <button onClick={() => router.push('/dashboard/suppliers')}
          className="text-sm text-[#3B6D11] hover:underline">
          ← Back to suppliers
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/dashboard/suppliers')} className="hover:text-gray-600">
          Suppliers
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">{supplier?.name ?? '…'}</span>
      </div>

      {/* Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {loading ? <span className="inline-block h-6 w-48 bg-gray-100 rounded animate-pulse" /> : supplier?.name}
        </h1>
        {admin && supplier && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-6">
          {[240, 'flex-1'].map((w, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
              style={{ width: typeof w === 'number' ? w : undefined, flex: typeof w === 'string' ? 1 : undefined }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j % 2 === 0 ? '60%' : '80%' }} />
              ))}
            </div>
          ))}
        </div>
      ) : supplier ? (
        <div className="flex gap-6 items-start">
          {/* Left: account info */}
          <div className="w-[240px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account info</h2>
            {[
              { label: 'Contact name', value: supplier.contactName },
              { label: 'Email', value: supplier.contactEmail, isEmail: true },
              { label: 'Phone', value: supplier.contactPhone },
              { label: 'Address', value: supplier.address },
              { label: 'Notes', value: supplier.notes },
            ].map(({ label, value, isEmail }) =>
              value ? (
                <div key={label}>
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                  {isEmail ? (
                    <a href={`mailto:${value}`} className="text-sm text-[#3B6D11] hover:underline break-all">{value}</a>
                  ) : (
                    <div className="text-sm text-gray-700">{value}</div>
                  )}
                </div>
              ) : null
            )}
          </div>

          {/* Right: products table */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Products supplied</h2>
            </div>
            {supplier.products.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No products linked yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Product', 'SKU', 'Our cost', 'Lead time', 'Preferred'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {supplier.products.map(p => (
                    <tr key={p.productId} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">{p.productName}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{p.sku}</td>
                      <td className="px-5 py-3 text-gray-700">{formatCurrency(p.costPrice, p.currency)}</td>
                      <td className="px-5 py-3 text-gray-600">{p.leadTimeDays} day{p.leadTimeDays !== 1 ? 's' : ''}</td>
                      <td className="px-5 py-3">
                        {p.isPreferred && (
                          <span className="text-[10px] font-medium text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 rounded-full">Preferred</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {editing && supplier && (
        <AddSupplierModal
          supplier={supplier}
          onClose={() => setEditing(false)}
          onSuccess={() => { setEditing(false); load() }}
        />
      )}
    </div>
  )
}
