import { Pencil } from 'lucide-react'
import { ScrollableTable } from '@/components/common/ScrollableTable'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { AvatarInitials } from '@/components/common/AvatarInitials'
import { StatusPill } from '@/components/common/StatusPill'
import type { User, AccountStatus } from '@/types/users'

const ROLE_COLORS: Record<string, string> = {
  ADMIN:       'bg-purple-100 text-purple-700',
  STAFF:       'bg-green-100 text-green-700',
  DEVELOPER:   'bg-blue-100 text-blue-700',
  ACCOUNTING:  'bg-amber-100 text-amber-700',
  DRIVER:      'bg-gray-100 text-gray-600',
  SALES:       'bg-teal-100 text-teal-700',
  INVENTORY:   'bg-orange-100 text-orange-700',
}

const STATUS_COLORS: Record<AccountStatus, string> = {
  ACTIVE:    'bg-[#EAF3DE] text-[#3B6D11]',
  SUSPENDED: 'bg-amber-50 text-amber-600',
  INACTIVE:  'bg-gray-100 text-gray-500',
}

interface Props {
  users: User[]
  loading?: boolean
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onReactivate: (user: User) => void
}

export function UsersTable({ users, loading, onEdit, onDeactivate, onReactivate }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ScrollableTable minWidth="650px">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Name', 'Email', 'Roles', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <LoadingSkeleton rows={4} cols={6} />}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-gray-400">No users found.</td></tr>
            )}
            {!loading && users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <AvatarInitials name={`${u.firstName} ${u.lastName}`} size="sm" />
                    <span className="font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map(r => (
                      <span key={r.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r.name] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill status={u.accountStatus} colorClass={STATUS_COLORS[u.accountStatus]} />
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onEdit(u)} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    {u.accountStatus === 'ACTIVE' ? (
                      <button onClick={() => onDeactivate(u)} className="px-2 py-1 text-xs text-amber-600 border border-amber-200 rounded hover:bg-amber-50">
                        Deactivate
                      </button>
                    ) : (
                      <button onClick={() => onReactivate(u)} className="px-2 py-1 text-xs text-[#3B6D11] border border-[#3B6D11] rounded hover:bg-[#EAF3DE]">
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTable>
    </div>
  )
}
