'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { getClients } from '@/lib/api/catalog'
import { AddClientModal } from '@/components/modals/AddClientModal'
import { PageHeader } from '@/components/common/PageHeader'
import { ClientsTable } from '@/components/pages/clients/ClientsTable'
import type { AccountStatus, ClientSummary } from '@/types/catalog'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'ALL'>('ALL')
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    setLoading(true)
    try { setClients(await getClients()) } catch { /* handled */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const displayed = clients
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => statusFilter === 'ALL' || c.accountStatus === statusFilter)

  return (
    <div className="page-container">
      <PageHeader
        title="Clients"
        actions={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add client</span>
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] w-56" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as AccountStatus | 'ALL')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <ClientsTable clients={displayed} loading={loading} onRowClick={id => router.push(`/dashboard/clients/${id}`)} />

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
