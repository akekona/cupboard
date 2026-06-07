import { cn } from '@/lib/utils'

export interface KpiCardProps {
  label: string
  value: string
  subtext?: string
  valueClassName?: string
  icon?: React.ReactNode
}

export function KpiCard({ label, value, subtext, valueClassName, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
      {icon && <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
        <div className={cn('text-2xl font-bold mb-0.5', valueClassName ?? 'text-gray-900')}>{value}</div>
        {subtext && <div className="text-xs text-gray-400">{subtext}</div>}
      </div>
    </div>
  )
}
