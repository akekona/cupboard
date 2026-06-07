import { cn } from '@/lib/utils'

interface Props {
  status: string
  colorClass: string
  className?: string
}

export function StatusPill({ status, colorClass, className }: Props) {
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colorClass, className)}>
      {status}
    </span>
  )
}
