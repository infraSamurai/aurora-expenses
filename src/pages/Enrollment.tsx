function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,23,20,0.08)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  )
}

const classes = [
  { name: 'Nursery', enrolled: 28, capacity: 40 },
  { name: 'LKG',     enrolled: 32, capacity: 40 },
  { name: 'UKG',     enrolled: 35, capacity: 40 },
  { name: 'I',       enrolled: 38, capacity: 40 },
  { name: 'II',      enrolled: 36, capacity: 40 },
  { name: 'III',     enrolled: 34, capacity: 40 },
  { name: 'IV',      enrolled: 33, capacity: 40 },
  { name: 'V',       enrolled: 31, capacity: 40 },
  { name: 'VI',      enrolled: 24, capacity: 40 },
  { name: 'VII',     enrolled: 22, capacity: 40 },
  { name: 'VIII',    enrolled: 20, capacity: 40 },
  { name: 'IX',      enrolled: 18, capacity: 40 },
  { name: 'X',       enrolled: 16, capacity: 40 },
]

const funnel = [
  { stage: 'Inquiries',   count: 58, pct: 100 },
  { stage: 'Visits',      count: 34, pct: 59 },
  { stage: 'Applications', count: 28, pct: 48 },
  { stage: 'Admitted',    count: 23, pct: 40 },
  { stage: 'Fee Paid',    count: 21, pct: 36 },
]

export default function Enrollment() {
  const total = classes.reduce((s, c) => s + c.enrolled, 0)
  const capacity = classes.reduce((s, c) => s + c.capacity, 0)
  const utilPct = Math.round((total / capacity) * 100)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: '#1A1714' }}>Enrollment & Growth</div>
        <div style={{ fontSize: 13, color: '#8B8175', marginTop: 4 }}>2025–26 academic year</div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Enrolled',     value: String(total),     sub: 'Across 13 classes',          color: '#4338CA' },
          { label: 'Total Capacity',     value: String(capacity),  sub: 'CBSE max 40/section',        color: '#1A1714' },
          { label: 'Utilisation',        value: `${utilPct}%`,     sub: utilPct >= 85 ? '⚠ Plan new section' : 'Room to grow', color: utilPct >= 85 ? '#D97706' : '#059669' },
          { label: 'Break-even Enroll.', value: '~220',           sub: 'Currently 347 — surplus zone', color: '#059669' },
        ].map(k => (
          <Card key={k.label}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B8175', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#8B8175', marginTop: 4 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Class utilisation bars */}
        <Card>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1A1714', marginBottom: 16 }}>
            Strength by Class
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {classes.map(c => {
              const pct = Math.round((c.enrolled / c.capacity) * 100)
              const color = pct >= 90 ? '#D97706' : pct >= 70 ? '#4338CA' : '#94A3B8'
              return (
                <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 52px', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#1A1714', fontWeight: 600 }}>Class {c.name}</span>
                  <div style={{ background: '#F7F4EF', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#8B8175', textAlign: 'right' }}>{c.enrolled}/{c.capacity}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Admission funnel */}
        <Card>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1A1714', marginBottom: 16 }}>
            Admission Funnel
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {funnel.map((f, i) => (
              <div key={f.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#3A3330' }}>{f.stage}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1714' }}>{f.count} <span style={{ color: '#8B8175', fontWeight: 400 }}>({f.pct}%)</span></span>
                </div>
                <div style={{ background: '#F7F4EF', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${f.pct}%`, background: i === 0 ? '#4338CA' : `rgba(67,56,202,${1 - i * 0.15})` }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#F7F4EF', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8B8175' }}>Inquiry → Admission conversion</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4338CA', marginTop: 2 }}>36% (target: 40%+)</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
