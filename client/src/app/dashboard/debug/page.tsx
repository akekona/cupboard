'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { getOrderDebugInfo } from '@/lib/api/debug'
import { getAuthUser, redirectUnauthorized } from '@/lib/auth'
import { formatCurrency } from '@/lib/currency'
import { getOrderStatusColor, formatOrderDate, formatShortDate } from '@/lib/orderHelpers'
import {
  getInvoiceStatusColor,
  getPaymentStatusColor,
  getPaymentMethodLabel,
  formatDateTime,
} from '@/lib/invoiceHelpers'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import type { OrderDebugResponse } from '@/types/debug'
import Link from 'next/link'

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</p>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">{children}</div>
  )
}

function DebugResults({ result }: { result: OrderDebugResponse }) {
  const { order, invoice, payment, flags } = result

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Order */}
        <Card>
          <SectionHeader label={order.orderNumber} />
          <div className="flex items-center gap-2 mb-3">
            <StatusPill status={order.status} colorClass={getOrderStatusColor(order.status)} />
          </div>
          <div className="space-y-0">
            <Row label="Client" value={
              <Link href={`/dashboard/clients/${order.clientId}`} className="text-[#3B6D11] hover:underline">
                {order.clientName}
              </Link>
            } />
            <Row label="Created by" value={order.createdByName} />
            <Row label="Created at" value={formatDateTime(order.createdAt)} />
            <Row label="Need by" value={order.needBy ? formatOrderDate(order.needBy) : null} />
            <Row label="Total" value={formatCurrency(order.totalAmount, order.currency)} />
          </div>
          {order.items.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-gray-400 font-medium pb-1">Product</th>
                    <th className="text-right text-gray-400 font-medium pb-1">Qty</th>
                    <th className="text-right text-gray-400 font-medium pb-1">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.sku} className="border-b border-gray-50 last:border-0">
                      <td className="py-1 text-gray-700">
                        <div>{item.productName}</div>
                        <div className="text-gray-400">{item.sku}</div>
                      </td>
                      <td className="py-1 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-1 text-right text-gray-700">
                        {formatCurrency(item.unitPrice, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Invoice */}
        <Card>
          <SectionHeader label={invoice ? `Invoice ${invoice.invoiceNumber}` : 'Invoice'} />
          {invoice ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <StatusPill status={invoice.status} colorClass={getInvoiceStatusColor(invoice.status)} />
              </div>
              <div className="space-y-0">
                <Row label="Due date" value={invoice.dueDate ? formatOrderDate(invoice.dueDate) : null} />
                <Row label="Sent at" value={invoice.sentAt ? formatDateTime(invoice.sentAt) : null} />
                <Row label="Paid at" value={invoice.paidAt ? formatDateTime(invoice.paidAt) : null} />
                <Row label="Total" value={formatCurrency(invoice.totalAmount, invoice.currency)} />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {invoice.stripeInvoiceUrl && (
                  <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#3B6D11] hover:underline">
                    View in Stripe <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <Link href={`/dashboard/invoices/${invoice.id}`}
                  className="text-xs text-gray-500 hover:text-gray-700 hover:underline">
                  View invoice →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">No invoice created for this order</p>
          )}
        </Card>

        {/* Payment */}
        <Card>
          <SectionHeader label="Payment" />
          {payment ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <StatusPill status={payment.status} colorClass={getPaymentStatusColor(payment.status)} />
              </div>
              <div className="space-y-0">
                <Row label="Method" value={getPaymentMethodLabel(payment.paymentMethod)} />
                <Row label="Amount" value={formatCurrency(payment.amount, payment.currency)} />
                <Row label="Date" value={formatDateTime(payment.createdAt)} />
              </div>
              {payment.stripePaymentUrl && (
                <div className="mt-3">
                  <a href={payment.stripePaymentUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#3B6D11] hover:underline">
                    View in Stripe <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No payment recorded</p>
          )}
        </Card>
      </div>

      {/* Flags */}
      <Card>
        <SectionHeader label="Potential issues" />
        {flags.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            No issues detected
          </div>
        ) : (
          <div className="space-y-2">
            {flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-amber-800">{flag}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default function DebugPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [searchedInput, setSearchedInput] = useState<string | null>(null)
  const [result, setResult] = useState<OrderDebugResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = getAuthUser()
    if (!user || (!user.roles.includes('ADMIN') && !user.roles.includes('DEVELOPER'))) {
      redirectUnauthorized(router)
    }
  }, [])

  function search() {
    const query = input.trim()
    if (!query) return
    setSearchedInput(query)
    setResult(null)
    setNotFound(false)
    setLoading(true)
    getOrderDebugInfo(query)
      .then(setResult)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search()
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Debug"
        subtitle="Investigate orders across order, invoice, and payment systems"
      />

      <div className="mb-6 flex gap-2 max-w-sm">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter order number (e.g. ORD-0073)..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/30 focus:border-[#3B6D11]"
        />
        <button
          onClick={search}
          disabled={loading || !input.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {!loading && !result && !notFound && searchedInput === null && (
        <p className="text-sm text-gray-400">
          Enter an order number above to see its full status across systems.
        </p>
      )}

      {!loading && notFound && (
        <p className="text-sm text-gray-500">Order {searchedInput} not found.</p>
      )}

      {!loading && result && <DebugResults result={result} />}
    </div>
  )
}
