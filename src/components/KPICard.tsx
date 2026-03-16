import type { KPI, Status } from '../types'

const statusColors: Record<Status, { bg: string; border: string; dot: string; label: string }> = {
  green: { bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A', label: '#15803D' },
  amber: { bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706', label: '#92400E' },
  red:   { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', label: '#B91C1C' },
}

export default function KPICard({ kpi }: { kpi: KPI }) {
  const c = statusColors[kpi.status]
  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '16px 18px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* status accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.dot, borderRadius: '12px 12px 0 0' }} />

      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B8175' }}>
        {kpi.label}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: '#1A1714', lineHeight: 1 }}>
          {kpi.value}
        </div>
        {kpi.trend && (
          <div style={{ fontSize: 13, color: c.dot, fontWeight: 600 }}>{kpi.trend}</div>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#8B8175', lineHeight: 1.4 }}>{kpi.subtext}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: c.label }}>
          {kpi.status}
        </span>
      </div>
    </div>
  )
}
