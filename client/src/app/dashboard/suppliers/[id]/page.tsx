'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Pencil } from 'lucide-react'
import { getSupplierById } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { AddSupplierModal } from '@/components/modals/AddSupplierModal'
import { NotFound } from '@/components/common/NotFound'
import { SupplierProductsTable } from '@/components/pages/suppliers/SupplierProductsTable'
import type { Supplier } from '@/types/catalog'

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const admin = isAdmin(getAuthUser() ?? { roles: [] } as never)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)

  async function load() {
    setLoading(true)
    try { setSupplier(await getSupplierById(Number(id))) }
    catch { setNotFound(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  if (notFound) return (
    <div className="page-container">
      <NotFound title="Supplier not found" backHref="/dashboard/suppliers" backLabel="Back to suppliers" />
    </div>
  )

  return (
    <div className="page-container">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/dashboard/suppliers')} className="hover:text-gray-600">Suppliers</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">{supplier?.name ?? '…'}</span>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          {loading ? <span className="inline-block h-6 w-48 bg-gray-100 rounded animate-pulse" /> : supplier?.name}
        </h1>
        {admin && supplier && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Pencil className="w-3.5 h-3.5" />Edit
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-6 flex-col lg:flex-row">
          {[240, 'flex-1'].map((w, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
              style={{ width: typeof w === 'number' ? w : undefined, flex: typeof w === 'string' ? 1 : undefined }}>
              {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j % 2 === 0 ? '60%' : '80%' }} />)}
            </div>
          ))}
        </div>
      ) : supplier ? (
        <div className="flex gap-6 items-start flex-col lg:flex-row">
          <div className="w-full lg:w-[240px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account info</h2>
            {[
              { label: 'Contact name', value: supplier.contactName },
              { label: 'Email', value: supplier.contactEmail, isEmail: true },
              { label: 'Phone', value: supplier.contactPhone },
              { label: 'Address', value: supplier.address },
              { label: 'Notes', value: supplier.notes },
            ].map(({ label, value, isEmail }) => value ? (
              <div key={label}>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                {isEmail ? <a href={`mailto:${value}`} className="text-sm text-[#3B6D11] hover:underline break-all">{value}</a> : <div className="text-sm text-gray-700">{value}</div>}
              </div>
            ) : null)}
          </div>
          <div className="flex-1 w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Products supplied</h2></div>
            {supplier.products.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No products linked yet.</div>
            ) : (
              <SupplierProductsTable products={supplier.products} isAdmin={admin} />
            )}
          </div>
        </div>
      ) : null}

      {editing && supplier && <AddSupplierModal supplier={supplier} onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); load() }} />}
    </div>
  )
}
