import { KpiCard, type KpiCardProps } from './KpiCard'

const GRID: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

interface Props {
  cards: KpiCardProps[]
  cols?: 2 | 3 | 4
}

export function KpiRow({ cards, cols = 3 }: Props) {
  return (
    <div className={`grid gap-4 mb-6 ${GRID[cols]}`}>
      {cards.map(card => <KpiCard key={card.label} {...card} />)}
    </div>
  )
}
