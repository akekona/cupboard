import { cn } from '@/lib/utils'

const COLORS = [
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
]

const SIZES = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

function nameHash(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) & 0xffff
  }
  return h
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
  colorIndex?: number
  className?: string
}

export function AvatarInitials({ name, size = 'md', colorIndex, className }: Props) {
  const idx = colorIndex !== undefined ? colorIndex % COLORS.length : nameHash(name) % COLORS.length
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center flex-shrink-0 font-semibold',
      COLORS[idx], SIZES[size], className,
    )}>
      {initials(name)}
    </div>
  )
}
