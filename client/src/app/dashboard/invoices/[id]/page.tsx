'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import {
  getInvoiceById, finalizeInvoice, sendInvoice, markPaid, refundInvoice,
} from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import {
  getInvoiceStatusColor, formatInvoiceDate, formatDateTime, isOverdue,
} from '@/lib/invoiceHelpers'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { FieldLabelText } from '@/components/ui/typography'
import type { Invoice, InvoiceStatus } from '@/types/invoices'

// ── Status stepper ─────────────────────────────────────────────────────────────

const STEPS: { key: InvoiceStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'FINALIZED', label: 'Finalized' },
  { key: 'SENT', label: 'Sent' },
  { key: 'PAID', label: 'Paid' },
]

function statusToStep(status: InvoiceStatus): number {
  switch (status) {
    case 'DRAFT':               return 0
    case 'FINALIZED':           return 1
    case 'SENT': case 'OVERDUE': return 2
    case 'PAID': case 'REFUNDED': return 3
  }
}

function InvoiceStepper({ status }: { status: InvoiceStatus }) {
  const currentStep = statusToStep(status)
  const isOverdueStatus = status === 'OVERDUE'
  const isRefunded = status === 'REFUNDED'

  return (
    <div className="flex items-center">
      {STEPS.map(({ key, label }, i) => {
        const done = i < currentStep
        const active = i === currentStep
        const stepLabel = key === 'SENT' && isOverdueStatus ? 'Overdue' : label
        const activeColor = isOverdueStatus && active ? 'bg-amber-500' : 'bg-[#3B6D11]'
        const activeText = isOverdueStatus && active ? 'text-amber-600' : 'text-[#3B6D11]'

        return (
          <div key={key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                done ? 'bg-[#3B6D11] text-white'
                : active ? `${activeColor} text-white`
                : 'bg-gray-200 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium uppercase tracking-wide ${
                done ? 'text-[#3B6D11]' : active ? activeText : 'text-gray-400'
              }`}>
                {stepLabel}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mb-4 mx-1 ${done ? 'bg-[#3B6D11]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
      {isRefunded && (
        <div className="flex items-center">
          <div className="w-12 h-0.5 mb-4 mx-1 bg-purple-200" />
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">↩</div>
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wide text-purple-600">Refunded</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Action config ──────────────────────────────────────────────────────────────

type ActionKey = 'finalize' | 'send' | 'mark-paid' | 'refund'

const ACTION_CONFIG: Record<ActionKey, {
  title: string
  variant: 'default' | 'danger'
  confirmLabel: string
  description: (inv: Invoice) => string
}> = {
  finalize: {
    title: 'Finalize invoice',
    variant: 'default',
    confirmLabel: 'Finalize',
    description: () => "This will lock the invoice amount. You won't be able to edit it after.",
  },
  send: {
    title: 'Send invoice',
    variant: 'default',
    confirmLabel: 'Send invoice',
    description: inv =>
      `This will send the invoice to ${inv.client.contactEmail ?? inv.client.name} via Stripe. They will receive a payment link by email.`,
  },
  'mark-paid': {
    title: 'Mark as paid',
    variant: 'default',
    confirmLabel: 'Mark as paid',
    description: () => 'Mark this invoice as paid manually?',
  },
  refund: {
    title: 'Refund invoice',
    variant: 'danger',
    confirmLabel: 'Refund',
    description: () => 'This will initiate a full refund via Stripe. This cannot be undone.',
  },
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const user = getAuthUser()
  const admin = user ? isAdmin(user) : false

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try { setInvoice(await getInvoiceById(Number(id))) }
    catch { setNotFound(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function handleAction() {
    if (!pendingAction || !invoice) return
    setActionLoading(true)
    setActionError(null)
    try {
      if (pendingAction === 'finalize') await finalizeInvoice(invoice.id)
      else if (pendingAction === 'send') await sendInvoice(invoice.id)
      else if (pendingAction === 'mark-paid') await markPaid(invoice.id)
      else if (pendingAction === 'refund') await refundInvoice(invoice.id)
      setPendingAction(null)
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed. Please try again.')
      setPendingAction(null)
    } finally {
      setActionLoading(false)
    }
  }

  if (notFound) {
    return (
      <div className="p-8 text-center py-20">
        <p className="text-gray-400 text-sm mb-3">Invoice not found.</p>
        <button onClick={() => router.push('/dashboard/invoices')} className="text-sm text-[#3B6D11] hover:underline">
          ← Back to invoices
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/dashboard/invoices')} className="hover:text-gray-600">
          Invoices
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">{invoice?.invoiceNumber ?? id}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invoice ? (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">{invoice.invoiceNumber}</h1>
              <div className="text-sm text-gray-500">{invoice.client.name}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getInvoiceStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>

              {invoice.status === 'DRAFT' && (
                <button
                  onClick={() => setPendingAction('finalize')}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]"
                >
                  Finalize invoice
                </button>
              )}
              {invoice.status === 'FINALIZED' && (
                <button
                  onClick={() => setPendingAction('send')}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-60"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Send invoice
                </button>
              )}
              {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && admin && (
                <button
                  onClick={() => setPendingAction('mark-paid')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Mark as paid
                </button>
              )}
              {invoice.status === 'PAID' && admin && (
                <button
                  onClick={() => setPendingAction('refund')}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Refund
                </button>
              )}
            </div>
          </div>

          {/* Status stepper */}
          <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-6">
            <InvoiceStepper status={invoice.status} />
          </div>

          {/* Error */}
          {actionError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {actionError}
            </div>
          )}

          {/* Body */}
          <div className="flex gap-5 items-start">
            {/* Left: invoice details */}
            <div className="flex-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Invoice details</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Description', 'Amount'].map(h => (
                        <th key={h} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        Order #{invoice.order.id} — {invoice.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 uppercase tracking-wide mr-4">Subtotal</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: info cards */}
            <div className="w-[300px] flex-shrink-0 space-y-4">
              {/* Invoice info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice info</h2>

                <div>
                  <FieldLabelText>Client</FieldLabelText>
                  <button
                    onClick={() => router.push(`/dashboard/clients/${invoice.client.id}`)}
                    className="text-sm text-[#3B6D11] hover:underline text-left"
                  >
                    {invoice.client.name}
                  </button>
                </div>

                {invoice.client.contactEmail && (
                  <div>
                    <FieldLabelText>Contact email</FieldLabelText>
                    <span className="text-sm text-gray-700">{invoice.client.contactEmail}</span>
                  </div>
                )}

                <div>
                  <FieldLabelText>Due date</FieldLabelText>
                  <span className={`text-sm ${isOverdue(invoice.dueDate, invoice.status) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                    {invoice.dueDate ? formatInvoiceDate(invoice.dueDate) : '—'}
                  </span>
                </div>

                <div>
                  <FieldLabelText>Notes</FieldLabelText>
                  <span className="text-sm text-gray-700">{invoice.notes || '—'}</span>
                </div>

                <div>
                  <FieldLabelText>Created</FieldLabelText>
                  <span className="text-sm text-gray-500">{formatInvoiceDate(invoice.createdAt)}</span>
                </div>
              </div>

              {/* Stripe card */}
              {invoice.stripeInvoiceId && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#635BFF] rounded flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">S</span>
                    </div>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stripe</h2>
                  </div>

                  <div>
                    <FieldLabelText>Invoice sent via Stripe</FieldLabelText>
                    <span className="text-sm text-gray-700">{formatDateTime(invoice.sentAt)}</span>
                  </div>

                  {invoice.stripeHostedUrl && (
                    <a
                      href={invoice.stripeHostedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-[#635BFF] hover:underline"
                    >
                      View in Stripe
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {invoice.paidAt && (
                    <div>
                      <FieldLabelText>Paid</FieldLabelText>
                      <span className="text-sm text-green-700 font-medium">{formatDateTime(invoice.paidAt)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Order card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order</h2>
                <div>
                  <FieldLabelText>Order</FieldLabelText>
                  <button
                    onClick={() => router.push(`/dashboard/orders/${invoice.order.id}`)}
                    className="text-sm text-[#3B6D11] hover:underline"
                  >
                    #{invoice.order.id}
                  </button>
                </div>
                <div>
                  <FieldLabelText>Status</FieldLabelText>
                  <span className="text-xs font-medium text-gray-700 uppercase">{invoice.order.status}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Confirm modal */}
      {pendingAction && invoice && (
        <ConfirmModal
          open={!!pendingAction}
          onClose={() => { setPendingAction(null); setActionError(null) }}
          onConfirm={handleAction}
          title={ACTION_CONFIG[pendingAction].title}
          description={ACTION_CONFIG[pendingAction].description(invoice)}
          confirmLabel={ACTION_CONFIG[pendingAction].confirmLabel}
          variant={ACTION_CONFIG[pendingAction].variant}
          isLoading={actionLoading}
        />
      )}
    </div>
  )
}
