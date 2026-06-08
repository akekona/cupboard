'use client'

import { useState } from 'react'
import { Modal } from '@/components/modals/Modal'
import { createUser } from '@/lib/api/users'
import { InputLabelText, RequiredInputLabelText } from '@/components/ui/typography'

const ALL_ROLES = ['ADMIN', 'STAFF', 'ACCOUNTING', 'DRIVER', 'SALES', 'INVENTORY', 'DEVELOPER']

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export function AddUserModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [roles, setRoles] = useState<string[]>(['STAFF'])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleRole(role: string) {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('All fields are required.'); return
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (roles.length === 0) { setError('Select at least one role.'); return }

    setSaving(true)
    setError(null)
    try {
      await createUser({ ...form, roleNames: roles })
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]'

  return (
    <Modal title="Add staff member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div><RequiredInputLabelText>First name</RequiredInputLabelText><input {...field('firstName')} className={inputCls} /></div>
          <div><RequiredInputLabelText>Last name</RequiredInputLabelText><input {...field('lastName')} className={inputCls} /></div>
        </div>

        <div><RequiredInputLabelText>Email</RequiredInputLabelText><input type="email" {...field('email')} className={inputCls} /></div>

        <div>
          <RequiredInputLabelText>Password</RequiredInputLabelText>
          <input type="password" {...field('password')} placeholder="Min 8 characters" className={inputCls} />
        </div>

        <div>
          <RequiredInputLabelText>Roles</RequiredInputLabelText>
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_ROLES.map(role => (
              <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="rounded"
                />
                <span className="text-xs text-gray-700">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-50">
            {saving ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
