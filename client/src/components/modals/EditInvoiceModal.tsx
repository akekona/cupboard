'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from './Modal'
import { InputLabelText } from '@/components/ui/typography'
import { updateInvoice } from '@/lib/api/invoices'
import type { Invoice } from '@/types/invoices'

interface Props {
  invoice: Invoice
  onClose: () => void
  onSave: () => void
}

export function EditInvoiceModal({ invoice, onClose, onSave }: Props) {
  const [dueDate, setDueDate] = useState(invoice.dueDate ?? '')
  const [notes, setNotes] = useState(invoice.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateInvoice(invoice.id, {
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      })
      onSave()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit invoice" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <InputLabelText>Due date</InputLabelText>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]"
          />
        </div>

        <div>
          <InputLabelText>Notes</InputLabelText>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any notes for this invoice..."
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-50">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  )
}
