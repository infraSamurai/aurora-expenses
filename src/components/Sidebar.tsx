type Page = 'pulse' | 'financial' | 'enrollment' | 'compliance'

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'pulse',      label: 'Founder Pulse',    icon: '◉' },
  { id: 'financial',  label: 'Financial Health',  icon: '₹' },
  { id: 'enrollment', label: 'Enrollment',        icon: '⌂' },
  { id: 'compliance', label: 'Compliance',        icon: '✓' },
]

export default function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: '#1A1714',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 16px',
      gap: 4,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg,#D4A853,#E8944A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: '#1A1714',
        }}>A</div>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, color: '#F7F4EF', fontWeight: 600 }}>Aurora OS</div>
          <div style={{ fontSize: 10, color: '#6B5E52', marginTop: 1 }}>Expenses · 2025–26</div>
        </div>
      </div>

      {/* Nav items */}
      {NAV.map(item => {
        const active = page === item.id
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'rgba(247,244,239,0.10)' : 'transparent',
              color: active ? '#F7F4EF' : '#6B5E52',
              fontSize: 13, fontWeight: active ? 600 : 400,
              fontFamily: 'DM Sans, system-ui, sans-serif',
              textAlign: 'left',
              transition: 'all 0.15s',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#D4A853' }} />}
          </button>
        )
      })}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingLeft: 8, paddingTop: 20, borderTop: '1px solid rgba(247,244,239,0.06)' }}>
        <div style={{ fontSize: 10, color: '#4A3F38', lineHeight: 1.6 }}>
          Akshararambh Public School<br />Varanasi · CBSE
        </div>
        <div style={{ fontSize: 10, color: '#3A2F28', marginTop: 6 }}>Mock data — Simption sync pending</div>
      </div>
    </aside>
  )
}
