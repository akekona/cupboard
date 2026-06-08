'use client'

import { useState } from 'react'
import { Modal } from '@/components/modals/Modal'
import { updateUser } from '@/lib/api/users'
import { InputLabelText, RequiredInputLabelText } from '@/components/ui/typography'
import type { User } from '@/types/users'

const ALL_ROLES = ['ADMIN', 'STAFF', 'ACCOUNTING', 'DRIVER', 'SALES', 'INVENTORY', 'DEVELOPER']

interface Props {
  user: User
  onClose: () => void
  onSuccess: () => void
}

export function EditUserModal({ user, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName })
  const [roles, setRoles] = useState<string[]>(user.roles.map(r => r.name))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleRole(role: string) {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName) { setError('First and last name are required.'); return }
    if (roles.length === 0) { setError('Select at least one role.'); return }

    setSaving(true)
    setError(null)
    try {
      await updateUser(user.id, { ...form, roleNames: roles })
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]'

  return (
    <Modal title={`Edit ${user.firstName} ${user.lastName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <RequiredInputLabelText>First name</RequiredInputLabelText>
            <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <RequiredInputLabelText>Last name</RequiredInputLabelText>
            <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inputCls} />
          </div>
        </div>

        <div>
          <InputLabelText>Email</InputLabelText>
          <input value={user.email} disabled className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
        </div>

        <div>
          <RequiredInputLabelText>Roles</RequiredInputLabelText>
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_ROLES.map(role => (
              <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={roles.includes(role)} onChange={() => toggleRole(role)} className="rounded" />
                <span className="text-xs text-gray-700">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
