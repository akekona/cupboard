'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { getClients } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { formatCurrency } from '@/lib/currency'
import { AddClientModal } from '@/components/modals/AddClientModal'
import type { AuthUser } from '@/types/auth'
import type { AccountStatus, ClientSummary } from '@/types/catalog'

const AVATAR_COLORS = ['#3B6D11', '#1d4ed8', '#d97706', '#7c3aed', '#0891b2', '#be123c']

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const STATUS_STYLES: Record<AccountStatus, string> = {
  ACTIVE: 'bg-[#EAF3DE] text-[#3B6D11]',
  SUSPENDED: 'bg-amber-50 text-amber-600',
  INACTIVE: 'bg-gray-100 text-gray-500',
}

export default function ClientsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'ALL'>('ALL')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => { setUser(getAuthUser()) }, [])

  async function load() {
    setLoading(true)
    try { setClients(await getClients()) } catch { /* handled */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const admin = user ? isAdmin(user) : false

  const displayed = clients
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => statusFilter === 'ALL' || c.accountStatus === statusFilter)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] w-56"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as AccountStatus | 'ALL')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Cafe', 'Contact', 'Status', 'Total spend', 'Orders', 'Outstanding', 'Since'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '70%' : '60%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-gray-400">
                  {search || statusFilter !== 'ALL' ? 'No clients match your filters.' : 'No clients yet.'}
                </td>
              </tr>
            )}

            {!loading && displayed.map((c, idx) => {
              const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              const outstanding = c.outstandingBalance
              const outstandingStyle = c.accountStatus === 'SUSPENDED' && outstanding > 0
                ? 'text-red-600'
                : outstanding > 0
                  ? 'text-amber-600'
                  : 'text-gray-700'

              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: color }}>
                        {initials(c.name)}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-gray-700">{c.contactName ?? '—'}</div>
                    {c.contactEmail && <div className="text-xs text-gray-400 mt-0.5">{c.contactEmail}</div>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[c.accountStatus]}`}>
                      {c.accountStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700">{formatCurrency(c.totalSpend, 'USD')}</td>
                  <td className="px-4 py-3.5 text-gray-700">{c.orderCount}</td>
                  <td className={`px-4 py-3.5 font-medium ${outstandingStyle}`}>
                    {outstanding > 0 ? formatCurrency(outstanding, 'USD') : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">—</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddClientModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />
      )}
    </div>
  )
}
