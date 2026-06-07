import { Check } from 'lucide-react'
import type { InvoiceStatus } from '@/types/invoices'

const STEPS = [
  { key: 'DRAFT' as InvoiceStatus, label: 'Draft' },
  { key: 'FINALIZED' as InvoiceStatus, label: 'Finalized' },
  { key: 'SENT' as InvoiceStatus, label: 'Sent' },
  { key: 'PAID' as InvoiceStatus, label: 'Paid' },
]

function statusToStep(status: InvoiceStatus): number {
  switch (status) {
    case 'DRAFT':                   return 0
    case 'FINALIZED':               return 1
    case 'SENT': case 'OVERDUE':    return 2
    case 'PAID': case 'REFUNDED':   return 3
  }
}

export function InvoiceStepper({ status }: { status: InvoiceStatus }) {
  const currentStep = statusToStep(status)
  const isOverdueStatus = status === 'OVERDUE'
  const isRefunded = status === 'REFUNDED'

  return (
    <div className="flex items-center">
      {STEPS.map(({ key, label }, i) => {
        const done   = i < currentStep
        const active = i === currentStep
        const stepLabel = key === 'SENT' && isOverdueStatus ? 'Overdue' : label
        const activeColor = isOverdueStatus && active ? 'bg-amber-500' : 'bg-[#3B6D11]'
        const activeText  = isOverdueStatus && active ? 'text-amber-600' : 'text-[#3B6D11]'
        return (
          <div key={key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                done ? 'bg-[#3B6D11] text-white' : active ? `${activeColor} text-white` : 'bg-gray-200 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium uppercase tracking-wide ${
                done ? 'text-[#3B6D11]' : active ? activeText : 'text-gray-400'
              }`}>{stepLabel}</span>
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
