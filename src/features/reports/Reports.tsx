import { useExpenses } from '../../hooks/useExpenses'
import { formatINRCompact, currentMonth, monthLabel } from '../../lib/format'
import { color, font } from '../../tokens'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

const MONTHS_BACK = 6

function getPastMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (n - 1 - i))
    return d.toISOString().slice(0, 7)
  })
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: color.ink, borderRadius: 8, padding: '8px 12px',
      color: 'white', fontSize: 11, fontFamily: font.mono,
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</div>
      <div>{formatINRCompact(payload[0].value)}</div>
    </div>
  )
}

export function Reports() {
  const months = getPastMonths(MONTHS_BACK)
  const current = currentMonth()

  // Fetch current month for KPIs
  const { data: curExpenses = [], isLoading } = useExpenses({ month: current })

  const totalSpent    = curExpenses.reduce((s, e) => s + e.amount, 0)
  const operational   = curExpenses.filter(e => e.category?.type === 'operational').reduce((s, e) => s + e.amount, 0)
  const capital       = curExpenses.filter(e => e.category?.type === 'capital').reduce((s, e) => s + e.amount, 0)
  const aiCount       = curExpenses.filter(e => e.aiExtracted).length
  const aiRate        = curExpenses.length > 0 ? Math.round((aiCount / curExpenses.length) * 100) : 0

  // Fetch all months for trend — parallel queries via individual useExpenses hooks
  // (React Query fires these concurrently; each key is independent)
  const m0 = useExpenses({ month: months[0] })
  const m1 = useExpenses({ month: months[1] })
  const m2 = useExpenses({ month: months[2] })
  const m3 = useExpenses({ month: months[3] })
  const m4 = useExpenses({ month: months[4] })
  const m5 = useExpenses({ month: months[5] })
  // React Query already fires these in parallel at the network level —
  // staleTime:30s means they resolve from cache when navigating back here
  const monthData = [m0, m1, m2, m3, m4, m5].map((q, i) => ({
    label: monthLabel(months[i]),
    month: months[i],
    total: (q.data ?? []).reduce((s, e) => s + e.amount, 0),
  }))

  // Category breakdown for current month
  const catMap: Record<string, { name: string; icon: string; total: number; color: string }> = {}
  for (const e of curExpenses) {
    if (!e.category) continue
    const key = e.categoryId ?? e.category.name
    if (!catMap[key]) catMap[key] = { name: e.category.name, icon: e.category.icon, total: 0, color: e.category.color }
    catMap[key].total += e.amount
  }
  const catBreakdown = Object.values(catMap).sort((a, b) => b.total - a.total)
  const maxCat = catBreakdown[0]?.total ?? 1

  const kpis = [
    { label: 'Total Spent',   value: isLoading ? '—' : formatINRCompact(totalSpent),  sub: monthLabel(current) },
    { label: 'Operational',   value: isLoading ? '—' : formatINRCompact(operational), sub: 'this month' },
    { label: 'Capital',       value: isLoading ? '—' : formatINRCompact(capital),     sub: 'this month' },
    { label: 'AI Capture',    value: `${aiRate}%`,                                    sub: `${aiCount} of ${curExpenses.length}` },
  ]

  return (
    <div style={{ background: color.parchment, minHeight: '100%', paddingBottom: 80, fontFamily: font.body }}>

      {/* Header */}
      <div style={{ background: color.white, borderBottom: `1px solid ${color.border}`, padding: '16px 16px 12px' }}>
        <div style={{ fontSize: 18, fontFamily: font.display, fontWeight: 700, color: color.ink }}>
          Monthly Reports
        </div>
        <div style={{ fontSize: 11, color: color.muted, marginTop: 2 }}>{monthLabel(current)}</div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 16px 4px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: color.white, border: `1px solid ${color.border}`,
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 9, color: color.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</div>
            <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: color.ink, marginTop: 4, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 9, color: color.muted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend chart */}
      <div style={{ margin: '12px 16px 0', background: color.white, border: `1px solid ${color.border}`, borderRadius: 12, padding: '16px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: color.ink, marginBottom: 16 }}>Monthly Trend</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={color.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: color.muted, fontFamily: font.body }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: color.muted, fontFamily: font.body }} axisLine={false} tickLine={false}
              tickFormatter={v => v > 0 ? formatINRCompact(v) : ''} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: `${color.accent}10` }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {monthData.map(m => (
                <Cell key={m.month} fill={m.month === current ? color.accent : `${color.accent}50`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <div style={{ margin: '12px 16px 0', background: color.white, border: `1px solid ${color.border}`, borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: color.ink, marginBottom: 14 }}>By Category</div>
          {catBreakdown.map(c => (
            <div key={c.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: color.ink }}>
                  <span style={{ marginRight: 6 }}>{c.icon}</span>{c.name}
                </div>
                <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: color.ink }}>
                  {formatINRCompact(c.total)}
                </div>
              </div>
              <div style={{ height: 4, background: color.border, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 10,
                  width: `${Math.round((c.total / maxCat) * 100)}%`,
                  background: c.color || color.accent,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
