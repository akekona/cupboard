'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getAuthUser } from '@/lib/auth'
import { getUsers, deactivateUser, reactivateUser } from '@/lib/api/users'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { UsersTable } from '@/components/pages/users/UsersTable'
import { AddUserModal } from '@/components/pages/users/AddUserModal'
import { EditUserModal } from '@/components/pages/users/EditUserModal'
import type { User } from '@/types/users'

export default function UsersPage() {
  const router = useRouter()
  const authUser = getAuthUser()
  const isAdmin = authUser?.roles.includes('ADMIN') ?? false

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) { router.replace('/dashboard'); return }
    load()
  }, [])

  async function load() {
    setLoading(true)
    try { setUsers(await getUsers()) } catch { /* handled */ }
    finally { setLoading(false) }
  }

  async function handleDeactivate() {
    if (!pendingDeactivate) return
    setActionLoading(true)
    try { await deactivateUser(pendingDeactivate.id); setPendingDeactivate(null); await load() }
    catch { setPendingDeactivate(null) }
    finally { setActionLoading(false) }
  }

  async function handleReactivate(user: User) {
    try { await reactivateUser(user.id); await load() } catch { /* handled */ }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Users"
        actions={isAdmin ? (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add staff</span>
          </button>
        ) : undefined}
      />

      <UsersTable
        users={users}
        loading={loading}
        onEdit={setEditing}
        onDeactivate={setPendingDeactivate}
        onReactivate={handleReactivate}
      />

      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />
      )}
      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load() }} />
      )}
      <ConfirmModal
        open={!!pendingDeactivate}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate user"
        description={`Are you sure you want to deactivate ${pendingDeactivate?.firstName ?? ''} ${pendingDeactivate?.lastName ?? ''}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        variant="warning"
        isLoading={actionLoading}
      />
    </div>
  )
}
