import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const config = { count: { label: 'Orders', color: '#3B6D11' } }

interface Props {
  data: { month: string; count: number }[]
}

export function OrderVolumeChart({ data }: Props) {
  if (!data.length) {
    return <div className="h-40 flex items-center justify-center text-sm text-gray-400">No volume data</div>
  }

  return (
    <ChartContainer config={config} style={{ height: 160 }} className="w-full aspect-auto">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3B6D11"
          strokeWidth={2}
          dot={{ fill: '#3B6D11', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
