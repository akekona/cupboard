'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Pencil } from 'lucide-react'
import { getClientById, suspendClient, reactivateClient } from '@/lib/api/catalog'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { formatCurrency } from '@/lib/currency'
import { getOrderStatusColor } from '@/lib/orderHelpers'
import { AddClientModal } from '@/components/modals/AddClientModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { StatusPill } from '@/components/common/StatusPill'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { ClientKpiRow } from '@/components/pages/clients/ClientKpiRow'
import type { AccountStatus, ClientDetail } from '@/types/catalog'

const STATUS_COLORS: Record<AccountStatus, string> = {
  ACTIVE:    'bg-[#EAF3DE] text-[#3B6D11]',
  SUSPENDED: 'bg-amber-50 text-amber-600',
  INACTIVE:  'bg-gray-100 text-gray-500',
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const admin = isAdmin(getAuthUser() ?? { roles: [] } as never)
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  async function load() {
    setLoading(true)
    try { setClient(await getClientById(Number(id))) }
    catch { setNotFound(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function handleSuspendConfirm() {
    if (!client) return
    setActionLoading(true)
    try { await suspendClient(client.id); setShowSuspendConfirm(false); await load() }
    catch { setShowSuspendConfirm(false) }
    finally { setActionLoading(false) }
  }

  async function handleReactivate() {
    if (!client) return
    setActionLoading(true)
    try { await reactivateClient(client.id); await load() }
    catch { /* handled */ }
    finally { setActionLoading(false) }
  }

  if (notFound) return (
    <div className="page-container text-center py-20">
      <p className="text-sm text-gray-400 mb-3">Client not found.</p>
      <button onClick={() => router.push('/dashboard/clients')} className="text-sm text-[#3B6D11] hover:underline">← Back to clients</button>
    </div>
  )

  return (
    <div className="page-container">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/dashboard/clients')} className="hover:text-gray-600">Clients</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">{client?.name ?? '…'}</span>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          {loading ? <span className="inline-block h-6 w-48 bg-gray-100 rounded animate-pulse" /> : client?.name}
        </h1>
        <div className="flex items-center gap-2">
          {client && <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><Pencil className="w-3.5 h-3.5" />Edit</button>}
          {admin && client?.accountStatus === 'ACTIVE' && <button onClick={() => setShowSuspendConfirm(true)} disabled={actionLoading} className="px-3 py-1.5 text-sm text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 disabled:opacity-50">Suspend</button>}
          {admin && client?.accountStatus === 'SUSPENDED' && <button onClick={handleReactivate} disabled={actionLoading} className="px-3 py-1.5 text-sm text-[#3B6D11] border border-[#3B6D11] rounded-lg hover:bg-[#EAF3DE] disabled:opacity-50">Reactivate</button>}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-6 items-start flex-col lg:flex-row">
          <div className="w-full lg:w-[220px] bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: i % 2 === 0 ? '60%' : '80%' }} />)}
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[0,1,2].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4"><div className="h-3 bg-gray-100 rounded animate-pulse mb-2 w-1/2" /><div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" /></div>)}</div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-40" />
          </div>
        </div>
      ) : client ? (
        <div className="flex gap-6 items-start flex-col lg:flex-row">
          <div className="w-full lg:w-[220px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account info</h2>
            {[
              { label: 'Contact', value: client.contactName },
              { label: 'Email', value: client.contactEmail, isEmail: true },
              { label: 'Phone', value: client.contactPhone },
              { label: 'Address', value: client.address },
            ].map(({ label, value, isEmail }) => value ? (
              <div key={label}>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                {isEmail ? <a href={`mailto:${value}`} className="text-sm text-[#3B6D11] hover:underline break-all">{value}</a> : <div className="text-sm text-gray-700">{value}</div>}
              </div>
            ) : null)}
            <div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Status</div>
              <StatusPill status={client.accountStatus} colorClass={STATUS_COLORS[client.accountStatus]} />
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            <ClientKpiRow totalSpend={client.totalSpend} orderCount={client.orderCount} outstandingBalance={client.outstandingBalance} currency="USD" />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Recent orders</h2></div>
              {client.recentOrders.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">No orders yet.</div>
              ) : (
                <ScrollableTable minWidth="500px">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Order #', 'Date', 'Status', 'Total'].map(h => <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {client.recentOrders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/orders/${o.id}`)}>
                          <td className="px-5 py-3 font-medium text-[#3B6D11]">#{o.id}</td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-5 py-3"><StatusPill status={o.status} colorClass={getOrderStatusColor(o.status as never)} /></td>
                          <td className="px-5 py-3 font-medium text-gray-700">{formatCurrency(o.totalAmount, o.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollableTable>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {editing && client && <AddClientModal client={client} onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); load() }} />}
      <ConfirmModal open={showSuspendConfirm} onClose={() => setShowSuspendConfirm(false)} onConfirm={handleSuspendConfirm}
        title="Suspend client" description={`Are you sure you want to suspend ${client?.name ?? 'this client'}?`}
        confirmLabel="Suspend" variant="warning" isLoading={actionLoading} />
    </div>
  )
}
