import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { monthlyFinancials, expenseBreakdown, defaulters } from '../lib/mockData'

const INR = (v: number) =>
  v < 0
    ? `−₹${Math.abs(v / 1000).toFixed(0)}K`
    : `₹${(v / 1000).toFixed(0)}K`

const ageBucket = (days: number) => {
  if (days > 90) return { label: '>90 days', color: '#DC2626' }
  if (days > 60) return { label: '61–90 days', color: '#F97316' }
  if (days > 30) return { label: '31–60 days', color: '#D97706' }
  return { label: '0–30 days', color: '#CA8A04' }
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1A1714' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#8B8175', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid rgba(26,23,20,0.08)',
      borderRadius: 12,
      padding: '20px 22px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function Financial() {
  const latest = monthlyFinancials[monthlyFinancials.length - 1]
  const totalDues = defaulters.reduce((s, d) => s + d.amount, 0)
  const salaryPct = expenseBreakdown.find(e => e.category === 'Salaries')?.pct ?? 0

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: '#1A1714' }}>Financial Health</div>
        <div style={{ fontSize: 13, color: '#8B8175', marginTop: 4 }}>2025–26 academic year · All figures in INR</div>
      </div>

      {/* Top KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Revenue (Mar)',    value: INR(latest.revenue),  sub: `${latest.collectionRate}% collected`,     color: '#059669' },
          { label: 'Expenses (Mar)',   value: INR(latest.expenses), sub: `Salary ${salaryPct}% of revenue`,        color: '#1A1714' },
          { label: 'Surplus (Mar)',    value: INR(latest.surplus),  sub: 'Operating margin ~17%',                  color: latest.surplus >= 0 ? '#059669' : '#DC2626' },
          { label: 'Total Dues Outstg', value: `₹${(totalDues/1000).toFixed(0)}K`, sub: `${defaulters.length} defaulters`, color: '#DC2626' },
        ].map(k => (
          <Card key={k.label}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B8175', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#8B8175', marginTop: 4 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Revenue vs Expenses bar chart */}
        <Card>
          <SectionTitle title="Revenue vs Expenses" sub="Last 6 months (₹ thousands)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyFinancials} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8B8175' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} />
              <Tooltip formatter={(v) => `₹${(Number(v)/1000).toFixed(0)}K`} contentStyle={{ border: '1px solid rgba(26,23,20,0.08)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue"  name="Revenue"  fill="#4338CA" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#E2E8F0" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Collection rate line */}
        <Card>
          <SectionTitle title="Fee Collection Rate" sub="% of fees billed that were collected" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyFinancials}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8175' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#8B8175' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ border: '1px solid rgba(26,23,20,0.08)', borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={92} stroke="#4338CA" strokeDasharray="4 3" label={{ value: 'Target 92%', fontSize: 10, fill: '#4338CA' }} />
              <Line type="monotone" dataKey="collectionRate" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: '#059669' }} name="Collection %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Expense breakdown + defaulters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>

        {/* Expense breakdown */}
        <Card>
          <SectionTitle title="Expense Breakdown" sub="March 2026" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expenseBreakdown.map(e => (
              <div key={e.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#3A3330' }}>{e.category}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1714' }}>
                    ₹{(e.amount / 1000).toFixed(0)}K · {e.pct}%
                  </span>
                </div>
                <div style={{ background: '#F7F4EF', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${e.pct}%`,
                    background: e.category === 'Salaries'
                      ? (salaryPct > 65 ? '#F97316' : '#4338CA')
                      : '#C7D2FE',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#F7F4EF', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8B8175' }}>Salary benchmark: 55–65% of revenue</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: salaryPct > 65 ? '#D97706' : '#059669', marginTop: 2 }}>
              Current: {salaryPct}% — {salaryPct > 65 ? 'Above target, monitor' : 'Within range'}
            </div>
          </div>
        </Card>

        {/* Fee defaulters */}
        <Card>
          <SectionTitle title="Fee Defaulters" sub={`Total outstanding: ₹${(totalDues/1000).toFixed(0)}K across ${defaulters.length} students`} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(26,23,20,0.08)' }}>
                  {['Student', 'Class', 'Dues', 'Overdue', 'Last Payment'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: '#8B8175', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {defaulters.map(d => {
                  const bucket = ageBucket(d.daysOverdue)
                  return (
                    <tr key={d.studentId} style={{ borderBottom: '1px solid rgba(26,23,20,0.05)' }}>
                      <td style={{ padding: '8px 10px', color: '#1A1714', fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: '8px 10px', color: '#8B8175' }}>{d.class}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1A1714' }}>₹{d.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          background: `${bucket.color}15`,
                          color: bucket.color,
                          fontWeight: 700, fontSize: 10,
                          padding: '3px 8px', borderRadius: 4,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {bucket.label}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#8B8175' }}>{d.lastPayment}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  )
}
