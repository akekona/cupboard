'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { createSupplier, updateSupplier } from '@/lib/api/catalog'
import type { Supplier } from '@/types/catalog'

interface Props {
  supplier?: Supplier
  onClose: () => void
  onSuccess: () => void
}

export function AddSupplierModal({ supplier, onClose, onSuccess }: Props) {
  const isEdit = !!supplier
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contactName: supplier?.contactName ?? '',
    contactEmail: supplier?.contactEmail ?? '',
    contactPhone: supplier?.contactPhone ?? '',
    address: supplier?.address ?? '',
    notes: supplier?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return }
    setSaving(true)
    try {
      const data = {
        name: form.name,
        contactName: form.contactName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        address: form.address || null,
        notes: form.notes || null,
      }
      if (isEdit && supplier) {
        await updateSupplier(supplier.id, data)
      } else {
        await createSupplier(data)
      }
      onSuccess()
    } catch (err: unknown) {
      setErrors({ _form: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit supplier' : 'Add supplier'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}

        <Field label="Name *" error={errors.name}>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className={cx(errors.name)} placeholder="Supplier name" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact name">
            <input value={form.contactName} onChange={e => set('contactName', e.target.value)}
              className={cx()} placeholder="Full name" />
          </Field>
          <Field label="Contact email">
            <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
              className={cx()} placeholder="email@example.com" />
          </Field>
        </div>

        <Field label="Contact phone">
          <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)}
            className={cx()} placeholder="(808) 555-0100" />
        </Field>

        <Field label="Address">
          <textarea value={form.address} onChange={e => set('address', e.target.value)}
            className={cx()} rows={2} placeholder="Street, City, State ZIP" />
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            className={cx()} rows={2} placeholder="Optional notes" />
        </Field>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add supplier'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function cx(error?: string) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] transition-colors ${error ? 'border-red-400' : 'border-gray-300'}`
}
