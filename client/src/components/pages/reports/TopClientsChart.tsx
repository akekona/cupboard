import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/currency'
import type { TopClient } from '@/types/dashboard'
import type { CurrencyCode } from '@/lib/currency'

const config = { totalSpend: { label: 'Spend', color: '#3B6D11' } }

interface Props {
  clients: TopClient[]
  currency: CurrencyCode
}

export function TopClientsChart({ clients, currency }: Props) {
  const data = clients.slice(0, 5)

  if (!data.length) {
    return <div className="h-52 flex items-center justify-center text-sm text-gray-400">No client data</div>
  }

  return (
    <ChartContainer config={config} style={{ height: 208 }} className="w-full aspect-auto">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 4 }}>
        <CartesianGrid horizontal={false} stroke="#f3f4f6" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${Math.round(v / 100)}`}
        />
        <YAxis
          type="category"
          dataKey="clientName"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={v => formatCurrency(Number(v), currency)} />
          }
        />
        <Bar dataKey="totalSpend" fill="#3B6D11" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
