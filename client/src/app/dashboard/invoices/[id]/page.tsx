'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import { getInvoiceById, finalizeInvoice, sendInvoice, markPaid, refundInvoice } from '@/lib/api/invoices'
import { formatCurrency } from '@/lib/currency'
import { getInvoiceStatusColor, formatInvoiceDate, formatDateTime, isOverdue } from '@/lib/invoiceHelpers'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { StatusPill } from '@/components/common/StatusPill'
import { FieldLabelText } from '@/components/ui/typography'
import { InvoiceStepper } from '@/components/pages/invoices/InvoiceStepper'
import type { Invoice, InvoiceStatus } from '@/types/invoices'

type ActionKey = 'finalize' | 'send' | 'mark-paid' | 'refund'

const ACTION_CONFIG: Record<ActionKey, { title: string; variant: 'default' | 'danger'; confirmLabel: string; description: (inv: Invoice) => string }> = {
  finalize:   { title: 'Finalize invoice', variant: 'default', confirmLabel: 'Finalize',     description: () => "This will lock the invoice amount. You won't be able to edit it after." },
  send:       { title: 'Send invoice',     variant: 'default', confirmLabel: 'Send invoice', description: inv => `This will send the invoice to ${inv.client.contactEmail ?? inv.client.name} via Stripe.` },
  'mark-paid':{ title: 'Mark as paid',     variant: 'default', confirmLabel: 'Mark as paid', description: () => 'Mark this invoice as paid manually?' },
  refund:     { title: 'Refund invoice',   variant: 'danger',  confirmLabel: 'Refund',       description: () => 'This will initiate a full refund via Stripe. This cannot be undone.' },
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const admin = isAdmin(getAuthUser() ?? { roles: [] } as never)
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
    } finally { setActionLoading(false) }
  }

  if (notFound) return (
    <div className="page-container text-center py-20">
      <p className="text-sm text-gray-400 mb-3">Invoice not found.</p>
      <button onClick={() => router.push('/dashboard/invoices')} className="text-sm text-[#3B6D11] hover:underline">← Back to invoices</button>
    </div>
  )

  return (
    <div className="page-container">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/dashboard/invoices')} className="hover:text-gray-600">Invoices</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">{invoice?.invoiceNumber ?? id}</span>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : invoice ? (
        <>
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">{invoice.invoiceNumber}</h1>
              <div className="text-sm text-gray-500">{invoice.client.name}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill status={invoice.status} colorClass={getInvoiceStatusColor(invoice.status)} />
              {invoice.status === 'DRAFT' && <button onClick={() => setPendingAction('finalize')} className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">Finalize invoice</button>}
              {invoice.status === 'FINALIZED' && <button onClick={() => setPendingAction('send')} disabled={actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-60">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Send invoice</button>}
              {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && admin && <button onClick={() => setPendingAction('mark-paid')} className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Mark as paid</button>}
              {invoice.status === 'PAID' && admin && <button onClick={() => setPendingAction('refund')} className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Refund</button>}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-6">
            <InvoiceStepper status={invoice.status} />
          </div>

          {actionError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{actionError}</div>}

          <div className="flex gap-5 items-start flex-col lg:flex-row">
            <div className="flex-1 w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Invoice details</h2></div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Description', 'Amount'].map(h => <th key={h} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>)}
                </tr></thead>
                <tbody><tr>
                  <td className="px-5 py-4 font-medium text-gray-900">Order #{invoice.order.id} — {invoice.invoiceNumber}</td>
                  <td className="px-5 py-4 text-right font-medium text-gray-900">{formatCurrency(invoice.totalAmount, invoice.currency)}</td>
                </tr></tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                <div className="text-right">
                  <span className="text-xs text-gray-400 uppercase tracking-wide mr-4">Subtotal</span>
                  <span className="text-base font-semibold text-gray-900">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice info</h2>
                <div><FieldLabelText>Client</FieldLabelText><button onClick={() => router.push(`/dashboard/clients/${invoice.client.id}`)} className="text-sm text-[#3B6D11] hover:underline">{invoice.client.name}</button></div>
                {invoice.client.contactEmail && <div><FieldLabelText>Email</FieldLabelText><span className="text-sm text-gray-700">{invoice.client.contactEmail}</span></div>}
                <div><FieldLabelText>Due date</FieldLabelText><span className={`text-sm ${isOverdue(invoice.dueDate, invoice.status as InvoiceStatus) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{invoice.dueDate ? formatInvoiceDate(invoice.dueDate) : '—'}</span></div>
                <div><FieldLabelText>Notes</FieldLabelText><span className="text-sm text-gray-700">{invoice.notes || '—'}</span></div>
                <div><FieldLabelText>Created</FieldLabelText><span className="text-sm text-gray-500">{formatInvoiceDate(invoice.createdAt)}</span></div>
              </div>
              {invoice.stripeInvoiceId && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                  <div className="flex items-center gap-2"><div className="w-5 h-5 bg-[#635BFF] rounded flex items-center justify-center"><span className="text-white text-[9px] font-bold">S</span></div><h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stripe</h2></div>
                  <div><FieldLabelText>Invoice sent via Stripe</FieldLabelText><span className="text-sm text-gray-700">{formatDateTime(invoice.sentAt)}</span></div>
                  {invoice.stripeHostedUrl && <a href={invoice.stripeHostedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[#635BFF] hover:underline">View in Stripe<ExternalLink className="w-3 h-3" /></a>}
                  {invoice.paidAt && <div><FieldLabelText>Paid</FieldLabelText><span className="text-sm text-green-700 font-medium">{formatDateTime(invoice.paidAt)}</span></div>}
                </div>
              )}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order</h2>
                <div><FieldLabelText>Order</FieldLabelText><button onClick={() => router.push(`/dashboard/orders/${invoice.order.id}`)} className="text-sm text-[#3B6D11] hover:underline">#{invoice.order.id}</button></div>
                <div><FieldLabelText>Status</FieldLabelText><span className="text-xs font-medium text-gray-700 uppercase">{invoice.order.status}</span></div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {pendingAction && invoice && (
        <ConfirmModal open={!!pendingAction} onClose={() => { setPendingAction(null); setActionError(null) }} onConfirm={handleAction}
          title={ACTION_CONFIG[pendingAction].title} description={ACTION_CONFIG[pendingAction].description(invoice)}
          confirmLabel={ACTION_CONFIG[pendingAction].confirmLabel} variant={ACTION_CONFIG[pendingAction].variant} isLoading={actionLoading} />
      )}
    </div>
  )
}
