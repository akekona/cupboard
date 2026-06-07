interface Props {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      {action}
    </div>
  )
}
