interface Props {
  rows?: number
  cols?: number
}

export function LoadingSkeleton({ rows = 5, cols = 4 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-3.5 bg-gray-100 rounded animate-pulse"
                style={{ width: j === 0 ? '40%' : j === 1 ? '65%' : '55%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
