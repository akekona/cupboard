'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getSuppliers } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { AddSupplierModal } from '@/components/modals/AddSupplierModal'
import type { AuthUser } from '@/types/auth'
import type { Supplier } from '@/types/catalog'

const AVATAR_COLORS = ['#3B6D11', '#1d4ed8', '#d97706', '#7c3aed']

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function cityState(address?: string) {
  if (!address) return ''
  const parts = address.split(',')
  return parts.length >= 3 ? `${parts[1].trim()}, ${parts[2].trim()}` : ''
}

export default function SuppliersPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  useEffect(() => {
    const u = getAuthUser()
    setUser(u)
    if (u && !isAdmin(u)) router.replace('/dashboard')
  }, [router])

  async function load() {
    setLoading(true)
    try { setSuppliers(await getSuppliers()) } catch { /* handled */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const admin = user ? isAdmin(user) : false

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Suppliers</h1>
        {admin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add supplier
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
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
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No suppliers yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {suppliers.map((s, idx) => {
            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
            const avgLead = s.products.length > 0
              ? Math.round(s.products.reduce((sum, p) => sum + p.leadTimeDays, 0) / s.products.length)
              : 0
            const tags = s.products.slice(0, 3)
            const extra = s.products.length - 3

            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initials(s.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                      {cityState(s.address) && (
                        <div className="text-xs text-gray-400 mt-0.5">{cityState(s.address)}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 rounded-full">Active</span>
                </div>

                {/* Email */}
                {s.contactEmail && (
                  <div className="text-xs text-gray-400 mb-3">{s.contactEmail}</div>
                )}

                {/* Product tags */}
                {s.products.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tags.map(p => (
                      <span key={p.productId} className="text-[10px] font-medium text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 rounded-full">
                        {p.productName.length > 18 ? p.productName.slice(0, 18) + '…' : p.productName}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        +{extra} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {s.products.length} {s.products.length === 1 ? 'product' : 'products'}
                    {avgLead > 0 && ` · avg ${avgLead}d lead`}
                  </span>
                  <button
                    onClick={() => router.push(`/dashboard/suppliers/${s.id}`)}
                    className="text-xs font-medium text-[#3B6D11] hover:underline"
                  >
                    View →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddSupplierModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />
      )}
      {editing && (
        <AddSupplierModal supplier={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load() }} />
      )}
    </div>
  )
}
