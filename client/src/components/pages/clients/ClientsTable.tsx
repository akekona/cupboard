import { formatCurrency } from '@/lib/currency'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { StatusPill } from '@/components/common/StatusPill'
import { AvatarInitials } from '@/components/common/AvatarInitials'
import type { ClientSummary, AccountStatus } from '@/types/catalog'

const STATUS_COLORS: Record<AccountStatus, string> = {
  ACTIVE:    'bg-[#EAF3DE] text-[#3B6D11]',
  SUSPENDED: 'bg-amber-50 text-amber-600',
  INACTIVE:  'bg-gray-100 text-gray-500',
}

interface Props {
  clients: ClientSummary[]
  loading?: boolean
  onRowClick: (id: number) => void
}

export function ClientsTable({ clients, loading, onRowClick }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ScrollableTable minWidth="650px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Cafe', 'Contact', 'Status', 'Total spend', 'Orders', 'Outstanding', 'Since'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <LoadingSkeleton rows={4} cols={7} />}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-gray-400">No clients yet.</td></tr>
            )}
            {!loading && clients.map((c, idx) => {
              const outstanding = c.outstandingBalance
              const outstandingClass = c.accountStatus === 'SUSPENDED' && outstanding > 0
                ? 'text-red-600' : outstanding > 0 ? 'text-amber-600' : 'text-gray-700'
              return (
                <tr key={c.id} onClick={() => onRowClick(c.id)} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <AvatarInitials name={c.name} colorIndex={idx} />
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-gray-700">{c.contactName ?? '—'}</div>
                    {c.contactEmail && <div className="text-xs text-gray-400 mt-0.5">{c.contactEmail}</div>}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={c.accountStatus} colorClass={STATUS_COLORS[c.accountStatus]} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-700">{formatCurrency(c.totalSpend, 'USD')}</td>
                  <td className="px-4 py-3.5 text-gray-700">{c.orderCount}</td>
                  <td className={`px-4 py-3.5 font-medium ${outstandingClass}`}>
                    {outstanding > 0 ? formatCurrency(outstanding, 'USD') : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">—</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollableTable>
    </div>
  )
}
