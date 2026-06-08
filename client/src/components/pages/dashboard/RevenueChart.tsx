import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/currency'
import type { RevenueByMonth } from '@/types/dashboard'

const config = {
  revenue: { label: 'Revenue', color: '#3B6D11' },
}

const CURRENT_MONTH = new Date().toLocaleString('en-US', { month: 'short' })

interface Props {
  data: RevenueByMonth[]
}

export function RevenueChart({ data }: Props) {
  if (!data.length) {
    return <div className="h-40 flex items-center justify-center text-sm text-gray-400">No revenue data</div>
  }

  return (
    <ChartContainer config={config} style={{ height: 160 }} className="w-full aspect-auto">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${Math.round(v / 100)}`}
          width={44}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatCurrency(Number(value), 'USD')}
            />
          }
        />
        <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.month === CURRENT_MONTH ? '#3B6D11' : '#C0DD97'} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
