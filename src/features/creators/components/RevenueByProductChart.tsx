import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { Product } from '../../products/model/types'

// Same order as Figma's PIE_C ([C.blue, C.purple, C.pink, C.amber]) — mapped to our tokens
// instead of the raw hex values, same as everywhere else this session.
const PIE_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-accent)', 'var(--color-chart-5)']

type RevenueByProductChartProps = {
  products: Product[] | null
  currency: string
}

export function RevenueByProductChart({ products, currency }: RevenueByProductChartProps) {
  const data = (products ?? []).filter((p) => p.revenueCents > 0)

  return (
    <div
      className="col-span-2 h-full flex flex-col rounded-xl bg-card p-5"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-sm font-bold mb-1">Revenue by Product</p>
      <p className="text-[11px] text-muted-foreground mb-4">All time breakdown</p>
      <div className="flex flex-1 items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={76}
              paddingAngle={3}
              dataKey="revenueCents"
              strokeWidth={0}
            >
              {data.map((p, i) => (
                <Cell key={p.publicId} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2.5 flex-1 min-w-0">
          {data.map((d, i) => (
            <div key={d.publicId} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-[10px] text-muted-foreground truncate">
                {d.name.split(' ').slice(0, 2).join(' ')}
              </span>
              <span className="text-[10px] font-mono text-foreground ml-auto shrink-0">
                {formatCurrency(d.revenueCents, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}
