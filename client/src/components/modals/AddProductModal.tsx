'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { createProduct, updateProduct } from '@/lib/api/catalog'
import { toSmallestUnit, fromSmallestUnit, CURRENCY_OPTIONS } from '@/lib/currency'
import type { CurrencyCode } from '@/lib/currency'
import type { Product, ProductCategory } from '@/types/catalog'

const CATEGORIES: ProductCategory[] = [
  'COFFEE', 'DAIRY', 'FOOD', 'DISPOSABLES', 'DISHWARE', 'EQUIPMENT', 'FURNITURE', 'CLEANING',
]

interface Props {
  product?: Product
  onClose: () => void
  onSuccess: () => void
}

export function AddProductModal({ product, onClose, onSuccess }: Props) {
  const isEdit = !!product
  const [form, setForm] = useState({
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: (product?.category ?? '') as ProductCategory | '',
    unitPriceDisplay: product
      ? String(fromSmallestUnit(product.unitPrice, product.currency))
      : '',
    currency: (product?.currency ?? 'USD') as CurrencyCode,
    unit: product?.unit ?? '',
    stockQuantity: product?.stockQuantity ?? 0,
    reorderThreshold: product?.reorderThreshold ?? 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.sku.trim()) e.sku = 'Required'
    if (!form.name.trim()) e.name = 'Required'
    if (!form.category) e.category = 'Required'
    const price = parseFloat(form.unitPriceDisplay)
    if (!form.unitPriceDisplay || isNaN(price) || price < 0) e.unitPriceDisplay = 'Enter a valid price'
    if (!form.unit.trim()) e.unit = 'Required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const price = toSmallestUnit(parseFloat(form.unitPriceDisplay), form.currency)
      if (isEdit && product) {
        await updateProduct(product.id, {
          name: form.name,
          description: form.description || null,
          category: form.category || null,
          unitPrice: price,
          unit: form.unit,
          stockQuantity: Number(form.stockQuantity),
          reorderThreshold: Number(form.reorderThreshold),
        })
      } else {
        await createProduct({
          sku: form.sku,
          name: form.name,
          description: form.description || null,
          category: form.category,
          unitPrice: price,
          currency: form.currency,
          unit: form.unit,
          stockQuantity: Number(form.stockQuantity),
          reorderThreshold: Number(form.reorderThreshold),
        })
      }
      onSuccess()
    } catch (err: unknown) {
      setErrors({ _form: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit product' : 'Add product'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}

        <div className="grid grid-cols-2 gap-4">
          <Field label="SKU *" error={errors.sku}>
            <input
              value={form.sku}
              onChange={e => set('sku', e.target.value)}
              disabled={isEdit}
              className={cx(errors.sku, isEdit && 'bg-gray-50 text-gray-500 cursor-not-allowed')}
              placeholder="COF-ETH-1KG"
            />
          </Field>
          <Field label="Unit *" error={errors.unit}>
            <input value={form.unit} onChange={e => set('unit', e.target.value)}
              className={cx(errors.unit)} placeholder="bag" />
          </Field>
        </div>

        <Field label="Name *" error={errors.name}>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className={cx(errors.name)} placeholder="Product name" />
        </Field>

        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            className={cx()} rows={2} placeholder="Optional" />
        </Field>

        <Field label="Category *" error={errors.category}>
          <select value={form.category} onChange={e => set('category', e.target.value as ProductCategory)}
            className={cx(errors.category)}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit price *" error={errors.unitPriceDisplay}>
            <input type="number" step="0.01" min="0"
              value={form.unitPriceDisplay} onChange={e => set('unitPriceDisplay', e.target.value)}
              className={cx(errors.unitPriceDisplay)} placeholder="28.00" />
          </Field>
          <Field label="Currency">
            {isEdit ? (
              <input value={form.currency} disabled className={cx(undefined, 'bg-gray-50 text-gray-500 cursor-not-allowed')} />
            ) : (
              <select value={form.currency} onChange={e => set('currency', e.target.value as CurrencyCode)}
                className={cx()}>
                {CURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Stock quantity">
            <input type="number" min="0" value={form.stockQuantity}
              onChange={e => set('stockQuantity', Number(e.target.value))} className={cx()} />
          </Field>
          <Field label="Reorder threshold">
            <input type="number" min="0" value={form.reorderThreshold}
              onChange={e => set('reorderThreshold', Number(e.target.value))} className={cx()} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3B6D11] rounded-lg hover:bg-[#2f5a0e] disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
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

function cx(error?: string, extra?: string) {
  return [
    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/40 focus:border-[#3B6D11] transition-colors',
    error ? 'border-red-400' : 'border-gray-300',
    extra ?? '',
  ].join(' ')
}
