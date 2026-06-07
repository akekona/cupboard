import { Check } from 'lucide-react'
import type { OrderStatus } from '@/types/orders'

const STEPS: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'FULFILLED']

export function OrderStepper({ status }: { status: OrderStatus }) {
  const currentIdx = STEPS.indexOf(status)
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              i <= currentIdx ? 'bg-[#3B6D11] text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium uppercase tracking-wide ${
              i <= currentIdx ? 'text-[#3B6D11]' : 'text-gray-400'
            }`}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 h-0.5 mb-4 mx-1 ${i < currentIdx ? 'bg-[#3B6D11]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
