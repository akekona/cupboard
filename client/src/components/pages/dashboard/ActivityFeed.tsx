import type { ActivityItem } from '@/types/dashboard'

const DOT: Record<ActivityItem['type'], string> = {
  ORDER_CONFIRMED: 'bg-green-500',
  ORDER_SHIPPED:   'bg-green-500',
  ORDER_FULFILLED: 'bg-green-500',
  INVOICE_SENT:    'bg-blue-500',
  INVOICE_PAID:    'bg-green-500',
  INVOICE_OVERDUE: 'bg-red-500',
  LOW_STOCK:       'bg-amber-500',
  CLIENT_ADDED:    'bg-green-500',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24)     return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Props {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: Props) {
  const items = activities.slice(0, 6)

  if (!items.length) {
    return <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
  }

  return (
    <div className="space-y-3">
      {items.map(a => (
        <div key={`${a.type}-${a.id}`} className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DOT[a.type]}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 leading-snug">{a.description}</p>
            {a.subtext && <p className="text-xs text-gray-400 mt-0.5">{a.subtext}</p>}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(a.createdAt)}</span>
        </div>
      ))}
    </div>
  )
}
