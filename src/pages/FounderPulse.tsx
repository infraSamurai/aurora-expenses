import KPICard from '../components/KPICard'
import { pulseKPIs } from '../lib/mockData'

const ALERTS = [
  { level: 'red',   msg: 'Outstanding dues ₹1.2L — 3 students >90 days overdue. Action needed.' },
  { level: 'amber', msg: 'CBSE affiliation renewal due in 28 days. File documents this week.' },
  { level: 'amber', msg: 'Cash reserve at 2.4 months — below 3-month target. Monitor inflows.' },
]

const levelColor: Record<string, string> = {
  red:   '#DC2626',
  amber: '#D97706',
}

export default function FounderPulse() {
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: '#1A1714' }}>
          Founder Pulse
        </div>
        <div style={{ fontSize: 13, color: '#8B8175', marginTop: 4 }}>{now} · 60-second school health check</div>
      </div>

      {/* Alerts */}
      {ALERTS.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {ALERTS.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#FFFFFF', border: `1px solid ${levelColor[a.level]}30`,
              borderLeft: `3px solid ${levelColor[a.level]}`,
              borderRadius: '0 8px 8px 0',
              padding: '10px 16px', fontSize: 13, color: '#1A1714',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <span style={{ color: levelColor[a.level], fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {a.level === 'red' ? '⚠' : '!'}
              </span>
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 36,
      }}>
        {pulseKPIs.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}
      </div>

      {/* Status summary bar */}
      <div style={{
        background: '#FFFFFF', border: '1px solid rgba(26,23,20,0.08)',
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', gap: 32, alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 12, color: '#8B8175', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Overall Status
        </div>
        {[
          { label: 'Green', count: pulseKPIs.filter(k => k.status === 'green').length, color: '#16A34A' },
          { label: 'Amber', count: pulseKPIs.filter(k => k.status === 'amber').length, color: '#D97706' },
          { label: 'Red',   count: pulseKPIs.filter(k => k.status === 'red').length,   color: '#DC2626' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1714' }}>{s.count}</span>
            <span style={{ fontSize: 12, color: '#8B8175' }}>{s.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#C4B5AB' }}>
          Data: mock — Simption sync not yet configured
        </div>
      </div>
    </div>
  )
}
