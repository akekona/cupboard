'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Minus, Plus, Search } from 'lucide-react'
import { getClients, getProducts } from '@/lib/api/catalog'
import { createOrder, confirmOrder } from '@/lib/api/orders'
import { formatCurrency, CURRENCY_OPTIONS } from '@/lib/currency'
import type { CurrencyCode } from '@/lib/currency'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { InputLabelText, RequiredInputLabelText, SectionHeaderText } from '@/components/ui/typography'
import type { ClientSummary, Product, ProductCategory } from '@/types/catalog'
import type { Order } from '@/types/orders'

const CATEGORIES: ProductCategory[] = [
  'COFFEE', 'DAIRY', 'FOOD', 'DISPOSABLES', 'DISHWARE', 'EQUIPMENT', 'FURNITURE', 'CLEANING',
]
const CAT_LABEL: Record<ProductCategory, string> = {
  COFFEE: 'Coffee', DAIRY: 'Dairy', FOOD: 'Food', DISPOSABLES: 'Disposables',
  DISHWARE: 'Dishware', EQUIPMENT: 'Equipment', FURNITURE: 'Furniture', CLEANING: 'Cleaning',
}

const WIZARD_STEPS = ['Select client', 'Add products', 'Review', 'Done']

function WizardStepper({ step }: { step: number }) {
  return (
    <div className="flex items-center mb-8">
      {WIZARD_STEPS.map((label, i) => {
        const idx = i + 1
        const done = idx < step
        const current = idx === step
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                done || current ? 'bg-[#3B6D11] text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${
                current ? 'text-[#3B6D11] font-medium' : done ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-2 ${done ? 'bg-[#3B6D11]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null)

  // Step 2
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productCategory, setProductCategory] = useState<ProductCategory>('COFFEE')
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map())
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [needBy, setNeedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Step 3+
  const [draftOrder, setDraftOrder] = useState<Order | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  useEffect(() => {
    getClients().then(setClients)
    getProducts({ size: 1000 }).then(r => setProducts(r.content))
  }, [])

  const filteredClients = clients
    .filter(c => c.accountStatus === 'ACTIVE')
    .filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()))

  const filteredProducts = products
    .filter(p => p.category === productCategory)
    .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))

  const selectedProductsList = products.filter(p => (selectedItems.get(p.id) ?? 0) > 0)

  const subtotal = selectedProductsList.reduce((sum, p) => {
    return sum + (selectedItems.get(p.id) ?? 0) * p.unitPrice
  }, 0)

  function setQty(productId: number, qty: number) {
    setSelectedItems(prev => {
      const next = new Map(prev)
      if (qty <= 0) next.delete(productId)
      else next.set(productId, qty)
      return next
    })
  }

  async function handleContinueToReview() {
    if (!selectedClient || selectedProductsList.length === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const items = selectedProductsList.map(p => ({
        productId: p.id,
        quantity: selectedItems.get(p.id)!,
      }))
      const order = await createOrder({
        clientId: selectedClient.id,
        currency,
        needBy: needBy || undefined,
        notes: notes || undefined,
        items,
      })
      setDraftOrder(order)
      setStep(3)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save order')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmOrder() {
    if (!draftOrder) return
    setConfirming(true)
    setConfirmError(null)
    try {
      const order = await confirmOrder(draftOrder.id)
      setConfirmedOrder(order)
      setShowConfirm(false)
      setStep(4)
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'Failed to confirm order')
      setShowConfirm(false)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="page-container max-w-5xl">
      <WizardStepper step={step} />

      {/* ── Step 1: Select client ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Select a client</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="Search clients…"
              className="pl-8 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]" />
          </div>
          <div className="space-y-2 mb-6">
            {filteredClients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No active clients found.</p>
            )}
            {filteredClients.map(c => (
              <button key={c.id} onClick={() => setSelectedClient(c)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${
                  selectedClient?.id === c.id
                    ? 'border-[#3B6D11] bg-[#EAF3DE]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                  {c.contactEmail && <div className="text-xs text-gray-400 mt-0.5">{c.contactEmail}</div>}
                </div>
                {selectedClient?.id === c.id && <Check className="w-4 h-4 text-[#3B6D11]" />}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard/orders')}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => setStep(2)} disabled={!selectedClient}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Add products ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="flex gap-6 items-start">
          {/* Left: product selector */}
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add products</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-8 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11]" />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setProductCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                    productCategory === cat
                      ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                      : 'text-[#3B6D11] border-[#3B6D11] hover:bg-[#EAF3DE]'
                  }`}>
                  {CAT_LABEL[cat]}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredProducts.map(p => {
                const qty = selectedItems.get(p.id) ?? 0
                const outOfStock = p.stockQuantity === 0
                return (
                  <div key={p.id} className={`flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 ${outOfStock ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatCurrency(p.unitPrice, p.currency)}/{p.unit}
                        {p.isLowStock && !outOfStock && <span className="ml-2 text-amber-500">Low stock</span>}
                        {outOfStock && <span className="ml-2 text-red-500">Out of stock</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-4 flex-shrink-0">
                      {qty === 0 ? (
                        <button onClick={() => !outOfStock && setQty(p.id, 1)} disabled={outOfStock}
                          className="h-6 px-2.5 text-xs font-medium text-[#3B6D11] border border-[#3B6D11] rounded-md hover:bg-[#EAF3DE] disabled:opacity-40 disabled:cursor-not-allowed">
                          + Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setQty(p.id, qty - 1)} disabled={outOfStock}
                            className="w-6 h-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40">
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={qty}
                            onChange={e => {
                              const v = e.target.value
                              if (v === '' || v === '0') { setQty(p.id, 0); return }
                              const n = parseInt(v, 10)
                              if (!isNaN(n) && n > 0) setQty(p.id, Math.min(p.stockQuantity, n))
                            }}
                            className="w-12 text-center text-sm font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6D11]/40"
                          />
                          <button onClick={() => setQty(p.id, Math.min(p.stockQuantity, qty + 1))}
                            disabled={outOfStock || qty >= p.stockQuantity}
                            className="w-6 h-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <span className={`text-[10px] text-amber-600 leading-none mt-0.5 ${qty > 0 && qty >= p.stockQuantity ? '' : 'invisible'}`}>
                        Max: {p.stockQuantity}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: order summary */}
          <div className="w-[280px] flex-shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionHeaderText className="mb-3">Order summary</SectionHeaderText>
              <div className="text-sm font-medium text-gray-900 mb-3">{selectedClient?.name}</div>
              {selectedProductsList.length === 0 ? (
                <p className="text-xs text-gray-400 italic mb-3">No items added yet.</p>
              ) : (
                <div className="space-y-1.5 mb-3">
                  {selectedProductsList.map(p => (
                    <div key={p.id} className="flex justify-between text-xs text-gray-600">
                      <span className="truncate flex-1">{p.name} ×{selectedItems.get(p.id)}</span>
                      <span className="ml-2 font-medium">{formatCurrency((selectedItems.get(p.id) ?? 0) * p.unitPrice, p.currency)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-semibold text-gray-900">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-gray-100 pt-3">
                <div>
                  <RequiredInputLabelText>Currency</RequiredInputLabelText>
                  <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40">
                    {CURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <InputLabelText>Need by</InputLabelText>
                  <input type="date" value={needBy} onChange={e => setNeedBy(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40" />
                </div>
                <div>
                  <InputLabelText>Notes</InputLabelText>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 resize-none"
                    placeholder="Optional notes" />
                </div>
              </div>

              {saveError && <p className="text-xs text-red-600 mt-2">{saveError}</p>}

              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button onClick={handleContinueToReview}
                  disabled={selectedProductsList.length === 0 || saving}
                  className="flex-1 py-1.5 text-xs font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-40">
                  {saving ? 'Saving…' : 'Continue →'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Draft auto-saved on continue</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ───────────────────────────────────────────────── */}
      {step === 3 && draftOrder && (
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Review order</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-4">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Client</div>
              <div className="text-sm font-medium text-gray-900">{draftOrder.client.name}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wide">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {draftOrder.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2 text-gray-900">{item.productName}</td>
                      <td className="py-2 text-right text-gray-500">×{item.quantity}</td>
                      <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(item.lineTotal, item.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between pt-3 border-t border-gray-100 text-sm font-semibold text-gray-900">
                <span>Subtotal</span>
                <span>{formatCurrency(draftOrder.subtotal, draftOrder.currency)}</span>
              </div>
            </div>
            {(draftOrder.needBy || draftOrder.notes) && (
              <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                {draftOrder.needBy && (
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Need by</div>
                    <div className="text-sm text-gray-700">{draftOrder.needBy}</div>
                  </div>
                )}
                {draftOrder.notes && (
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Notes</div>
                    <div className="text-sm text-gray-700">{draftOrder.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
            <span>⚠️ Confirming will decrement inventory and create a draft invoice.</span>
          </div>

          {confirmError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              {confirmError}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              ← Back
            </button>
            <button onClick={() => setShowConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
              Confirm order
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ─────────────────────────────────────────────────── */}
      {step === 4 && confirmedOrder && (
        <div className="max-w-md mx-auto text-center py-8">
          <div className="w-16 h-16 bg-[#EAF3DE] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#3B6D11]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order {confirmedOrder.orderNumber} confirmed!</h2>
          <p className="text-sm text-gray-500 mb-1">Inventory updated</p>
          {confirmedOrder.invoice && (
            <p className="text-sm text-gray-500 mb-6">
              Draft invoice <span className="font-medium text-[#3B6D11]">{confirmedOrder.invoice.invoiceNumber}</span> created
            </p>
          )}
          <div className="flex justify-center gap-3">
            <button onClick={() => router.push(`/dashboard/orders/${confirmedOrder.id}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e]">
              View order
            </button>
            <button onClick={() => { setStep(1); setSelectedClient(null); setSelectedItems(new Map()); setDraftOrder(null); setConfirmedOrder(null) }}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              New order
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmOrder}
        title="Confirm order"
        description="This will decrement inventory and create a draft invoice."
        confirmLabel="Confirm order"
        variant="default"
        isLoading={confirming}
      />
    </div>
  )
}
