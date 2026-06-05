'use client'

import { AlertTriangle, Check, Loader2, Trash2 } from 'lucide-react'

type Variant = 'danger' | 'warning' | 'default'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  isLoading?: boolean
}

const CONFIG: Record<Variant, {
  iconBg: string
  iconColor: string
  Icon: React.ComponentType<{ className?: string }>
  btnClass: string
}> = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: Trash2,
    btnClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    Icon: AlertTriangle,
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  default: {
    iconBg: 'bg-[#EAF3DE]',
    iconColor: 'text-[#3B6D11]',
    Icon: Check,
    btnClass: 'bg-[#3B6D11] hover:bg-[#2f5a0e] text-white',
  },
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  if (!open) return null

  const { iconBg, iconColor, Icon, btnClass } = CONFIG[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={isLoading ? undefined : onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">

        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-medium rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 ${btnClass}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
