'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Check, Pencil, Trash2 } from 'lucide-react'
import { getOrderById, confirmOrder, shipOrder, fulfillOrder, deleteOrder } from '@/lib/api/orders'
import { formatCurrency } from '@/lib/currency'
import { getOrderStatusColor, formatOrderDate } from '@/lib/orderHelpers'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { EditOrderModal } from '@/components/modals/EditOrderModal'
import type { Order, OrderStatus } from '@/types/orders'

const STATUS_STEPS: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'FULFILLED']

const CONFIRM_CONFIG: Record<string, {
  title: string; description: string
  variant: 'default' | 'warning' | 'danger'; confirmLabel: string
}> = {
  confirm: {
    title: 'Confirm order',
    description: 'This will decrement inventory and create a draft invoice.',
    variant: 'default', confirmLabel: 'Confirm order',
  },
  ship: {
    title: 'Mark as shipped',
    description: 'Confirm that this order has been shipped.',
    variant: 'default', confirmLabel: 'Mark as shipped',
  },
  fulfill: {
    title: 'Mark as fulfilled',
    description: 'Confirm that this order has been delivered.',
    variant: 'default', confirmLabel: 'Mark as fulfilled',
  },
  delete: {
    title: 'Delete order',
    description: 'Are you sure you want to delete this draft order? This action cannot be undone.',
    variant: 'danger', confirmLabel: 'Delete',
  },
}

function OrderStepper({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < currentIdx ? 'bg-[#3B6D11] text-white' :
              i === currentIdx ? 'bg-[#3B6D11] text-white' :
              'bg-gray-200 text-gray-400'
            }`}>
              {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium uppercase tracking-wide ${
              i <= currentIdx ? 'text-[#3B6D11]' : 'text-gray-400'
            }`}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`w-16 h-0.5 mb-4 mx-1 ${i < currentIdx ? 'bg-[#3B6D11]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)

  async function load() {
    setLoading(true)
    try { setOrder(await getOrderById(Number(id))) }
    catch { setNotFound(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function handleAction() {
    if (!pendingAction || !order) return
    setActionLoading(true)
    setActionError(null)
    try {
      if (pendingAction === 'confirm') await confirmOrder(order.id)
      else if (pendingAction === 'ship') await shipOrder(order.id)
      else if (pendingAction === 'fulfill') await fulfillOrder(order.id)
      else if (pendingAction === 'delete') {
        await deleteOrder(order.id)
        router.push('/dashboard/orders')
        return
      }
      await load()
      setPendingAction(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed')
      setPendingAction(null)
    } finally {
      setActionLoading(false)
    }
  }

  if (notFound) {
    return (
      <div className="p-8 text-center py-20">
        <p className="text-gray-400 text-sm mb-3">Order not found.</p>
        <button onClick={() => router.push('/dashboard/orders')} className="text-sm text-[#3B6D11] hover:underline">
          ← Back to orders
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/dashboard/orders')} className="hover:text-gray-600">Orders</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">#{id}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : order ? (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Order #{order.id}</h1>
              <div className="text-sm text-gray-500">
                {order.client.name}
                {order.client.contactEmail && (
                  <span className="text-gray-400"> · {order.client.contactEmail}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getOrderStatusColor(order.status)}`}>
                {order.status}
              </span>
              {order.status === 'DRAFT' && (
                <>
                  <button onClick={() => setShowEdit(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Pencil className="w-3.5 h-3.5" />Edit
                  </button>
                  <button onClick={() => setPendingAction('confirm')}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
                    Confirm order
                  </button>
                  <button onClick={() => setPendingAction('delete')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </>
              )}
              {order.status === 'CONFIRMED' && (
                <button onClick={() => setPendingAction('ship')}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
                  Mark as shipped
                </button>
              )}
              {order.status === 'SHIPPED' && (
                <button onClick={() => setPendingAction('fulfill')}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
                  Mark as fulfilled
                </button>
              )}
            </div>
          </div>

          {/* Stepper */}
          <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-6">
            <OrderStepper status={order.status} />
          </div>

          {actionError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {actionError}
            </div>
          )}

          {/* Body */}
          <div className="flex gap-5 items-start">
            {/* Left: items */}
            <div className="flex-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Order items</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Product', 'SKU', 'Unit price', 'Qty', 'Line total'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-5 py-3 font-medium text-gray-900">{item.productName}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">{item.productSku}</td>
                        <td className="px-5 py-3 text-gray-600">{formatCurrency(item.unitPrice, item.currency)}</td>
                        <td className="px-5 py-3 text-gray-700">×{item.quantity}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{formatCurrency(item.lineTotal, item.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Footer totals */}
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 uppercase tracking-wide mr-4">Subtotal</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatCurrency(order.subtotal, order.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: info + invoice */}
            <div className="w-[320px] flex-shrink-0 space-y-4">
              {/* Order info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order info</h2>
                {[
                  {
                    label: 'Client',
                    value: (
                      <button onClick={() => router.push(`/dashboard/clients/${order.client.id}`)}
                        className="text-sm text-[#3B6D11] hover:underline text-left">
                        {order.client.name}
                      </button>
                    ),
                  },
                  { label: 'Created by', value: <span className="text-sm text-gray-700">{order.createdBy.firstName} {order.createdBy.lastName}</span> },
                  { label: 'Need by', value: <span className="text-sm text-gray-700">{formatOrderDate(order.needBy)}</span> },
                  { label: 'Notes', value: <span className="text-sm text-gray-700">{order.notes || '—'}</span> },
                  { label: 'Created', value: <span className="text-sm text-gray-500">{formatOrderDate(order.createdAt)}</span> },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                    {value}
                  </div>
                ))}
              </div>

              {/* Invoice */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Invoice</h2>
                {order.invoice ? (
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Number</div>
                      <button onClick={() => router.push(`/dashboard/invoices/${order.invoice!.id}`)}
                        className="text-sm font-medium text-[#3B6D11] hover:underline">
                        {order.invoice.invoiceNumber}
                      </button>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Status</div>
                      <span className="text-xs font-medium text-gray-700 uppercase">{order.invoice.status}</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Total</div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.invoice.totalAmount, order.currency)}
                      </span>
                    </div>
                    <button onClick={() => router.push(`/dashboard/invoices/${order.invoice!.id}`)}
                      className="mt-2 w-full py-1.5 text-xs font-medium text-[#3B6D11] border border-[#3B6D11] rounded-lg hover:bg-[#EAF3DE] transition-colors">
                      View invoice →
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Invoice will be created when the order is confirmed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Confirm modal */}
      {pendingAction && CONFIRM_CONFIG[pendingAction] && (
        <ConfirmModal
          open={!!pendingAction}
          onClose={() => { setPendingAction(null); setActionError(null) }}
          onConfirm={handleAction}
          title={CONFIRM_CONFIG[pendingAction].title}
          description={CONFIRM_CONFIG[pendingAction].description}
          confirmLabel={CONFIRM_CONFIG[pendingAction].confirmLabel}
          variant={CONFIRM_CONFIG[pendingAction].variant}
          isLoading={actionLoading}
        />
      )}

      {/* Edit modal */}
      {showEdit && order && (
        <EditOrderModal
          order={order}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); load() }}
        />
      )}
    </div>
  )
}
