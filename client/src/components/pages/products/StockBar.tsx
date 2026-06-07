import { cn } from '@/lib/utils'

interface Props {
  stockQuantity: number
  reorderThreshold: number
  className?: string
}

export function StockBar({ stockQuantity, reorderThreshold, className }: Props) {
  const color = stockQuantity === 0 ? 'red' : stockQuantity <= reorderThreshold ? 'amber' : 'green'
  const max = Math.max(stockQuantity, reorderThreshold, 1)
  const pct = Math.min((stockQuantity / max) * 100, 100)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-[70px] h-[5px] bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
        <div
          className={`h-full rounded-full ${color === 'green' ? 'bg-[#3B6D11]' : color === 'amber' ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${color === 'green' ? 'text-[#3B6D11]' : color === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
        {stockQuantity}/{reorderThreshold}
      </span>
    </div>
  )
}
