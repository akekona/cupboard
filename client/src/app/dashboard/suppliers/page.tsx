'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getSuppliers } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { AddSupplierModal } from '@/components/modals/AddSupplierModal'
import { PageHeader } from '@/components/common/PageHeader'
import { SuppliersGrid } from '@/components/pages/suppliers/SuppliersGrid'
import type { Supplier } from '@/types/catalog'

export default function SuppliersPage() {
  const router = useRouter()
  const admin = isAdmin(getAuthUser() ?? { roles: [] } as never)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  useEffect(() => {
    if (!admin) { router.replace('/dashboard'); return }
    setLoading(true)
    getSuppliers().then(setSuppliers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Suppliers"
        actions={admin ? (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add supplier</span>
          </button>
        ) : undefined}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SuppliersGrid suppliers={suppliers} onView={id => router.push(`/dashboard/suppliers/${id}`)} />
      )}

      {showAdd && <AddSupplierModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); getSuppliers().then(setSuppliers) }} />}
      {editing && <AddSupplierModal supplier={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); getSuppliers().then(setSuppliers) }} />}
    </div>
  )
}
