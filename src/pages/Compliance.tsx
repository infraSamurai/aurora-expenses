const today = new Date('2026-03-16')

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function statusFromDays(days: number): { label: string; color: string; bg: string } {
  if (days < 0)  return { label: 'EXPIRED',  color: '#DC2626', bg: '#FEF2F2' }
  if (days < 30) return { label: 'URGENT',   color: '#DC2626', bg: '#FEF2F2' }
  if (days < 90) return { label: 'DUE SOON', color: '#D97706', bg: '#FFFBEB' }
  return { label: 'VALID', color: '#059669', bg: '#F0FDF4' }
}

const items = [
  { doc: 'CBSE Affiliation',            expiry: '2026-04-13', notes: 'File renewal application to regional office' },
  { doc: 'Fire Safety Certificate',     expiry: '2026-09-20', notes: 'Annual inspection by Fire Department' },
  { doc: 'Building Safety Certificate', expiry: '2026-11-05', notes: 'Municipal authority inspection' },
  { doc: 'Water Potability Certificate',expiry: '2027-01-15', notes: 'Health Department — drinking water test' },
  { doc: 'UDISE+ Submission',           expiry: '2026-09-30', notes: 'Annual data submission to Ministry of Education' },
  { doc: 'RTE 25% Quota Compliance',    expiry: '2026-06-01', notes: 'EWS seat confirmation for new academic year' },
  { doc: 'PF/ESI Monthly Compliance',  expiry: '2026-04-15', notes: 'Monthly employee provident fund deposit' },
  { doc: 'Teacher Qualification Audit', expiry: '2026-05-31', notes: 'Verify all teachers hold required B.Ed/D.El.Ed' },
]

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,23,20,0.08)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  )
}

export default function Compliance() {
  const sorted = [...items].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry))
  const expired = sorted.filter(i => daysUntil(i.expiry) < 0).length
  const urgent  = sorted.filter(i => daysUntil(i.expiry) >= 0 && daysUntil(i.expiry) < 30).length
  const dueSoon = sorted.filter(i => daysUntil(i.expiry) >= 30 && daysUntil(i.expiry) < 90).length
  const valid   = sorted.filter(i => daysUntil(i.expiry) >= 90).length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: '#1A1714' }}>Compliance Calendar</div>
        <div style={{ fontSize: 13, color: '#8B8175', marginTop: 4 }}>All certificates and regulatory deadlines · Sorted by urgency</div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Expired',  value: expired,  color: '#DC2626' },
          { label: 'Urgent (<30 days)',  value: urgent,   color: '#DC2626' },
          { label: 'Due Soon (<90 days)', value: dueSoon, color: '#D97706' },
          { label: 'Valid (>90 days)', value: valid,    color: '#059669' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B8175', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(26,23,20,0.08)' }}>
                {['Document / Certificate', 'Expiry / Due Date', 'Days Left', 'Status', 'Action Required'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#8B8175', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(item => {
                const days = daysUntil(item.expiry)
                const s = statusFromDays(days)
                return (
                  <tr key={item.doc} style={{ borderBottom: '1px solid rgba(26,23,20,0.05)', background: days < 30 ? s.bg : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1A1714' }}>{item.doc}</td>
                    <td style={{ padding: '10px 12px', color: '#8B8175' }}>
                      {new Date(item.expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: s.color }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: s.bg, color: s.color,
                        fontWeight: 700, fontSize: 10, padding: '3px 8px',
                        borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.07em',
                        border: `1px solid ${s.color}30`,
                      }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6B5E52', fontSize: 12 }}>{item.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
