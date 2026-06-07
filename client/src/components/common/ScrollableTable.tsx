interface Props {
  children: React.ReactNode
  minWidth?: string
}

export function ScrollableTable({ children, minWidth = '600px' }: Props) {
  return (
    <div className="overflow-x-auto w-full">
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  )
}
