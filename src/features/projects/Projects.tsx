import { useProjects } from '../../hooks/useProjects'
import { useExpenses } from '../../hooks/useExpenses'
import { formatINRCompact, formatINR } from '../../lib/format'
import { color, font } from '../../tokens'

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = Math.min(Math.round((spent / budget) * 100), 100)
  const barColor = pct >= 95 ? color.error : pct >= 80 ? color.warning : color.success
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: color.muted }}>
          {formatINRCompact(spent)} spent of {formatINRCompact(budget)}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: barColor }}>{pct}%</div>
      </div>
      <div style={{ height: 6, background: color.border, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 10,
          width: `${pct}%`, background: barColor,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

export function Projects() {
  const { data: projects = [], isLoading } = useProjects('all')
  const { data: allExpenses = [] }         = useExpenses({})

  // Compute spent per project from expenses
  const spentByProject: Record<string, number> = {}
  for (const e of allExpenses) {
    if (!e.projectId) continue
    spentByProject[e.projectId] = (spentByProject[e.projectId] ?? 0) + e.amount
  }

  const STATUS_COLOR = {
    active:    { dot: color.success, label: 'Active' },
    paused:    { dot: color.warning, label: 'Paused' },
    completed: { dot: color.muted,   label: 'Done'   },
  }

  return (
    <div style={{ background: color.parchment, minHeight: '100%', paddingBottom: 80, fontFamily: font.body }}>

      {/* Header */}
      <div style={{ background: color.white, borderBottom: `1px solid ${color.border}`, padding: '16px 16px 12px' }}>
        <div style={{ fontSize: 18, fontFamily: font.display, fontWeight: 700, color: color.ink }}>
          Capital Projects
        </div>
        <div style={{ fontSize: 11, color: color.muted, marginTop: 2 }}>
          {projects.filter(p => p.status === 'active').length} active projects
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {isLoading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>Loading…</div>
        )}
        {!isLoading && projects.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>
            No projects created yet.
          </div>
        )}
        {projects.map(p => {
          const spent  = spentByProject[p.id] ?? p.spentToDate ?? 0
          const sm     = STATUS_COLOR[p.status]
          const pct    = p.totalBudget > 0 ? Math.min(Math.round((spent / p.totalBudget) * 100), 100) : 0
          return (
            <div
              key={p.id}
              style={{
                background: color.white, border: `1px solid ${color.border}`,
                borderRadius: 12, marginBottom: 12, padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: sm.dot }} />
                    <span style={{ fontSize: 9, color: color.muted, fontWeight: 500 }}>{sm.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: color.ink }}>{p.name}</div>
                  {p.description && (
                    <div style={{ fontSize: 11, color: color.muted, marginTop: 3 }}>{p.description}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: color.ink }}>
                    {formatINR(p.totalBudget)}
                  </div>
                  <div style={{ fontSize: 9, color: color.muted }}>budget</div>
                </div>
              </div>

              <BudgetBar spent={spent} budget={p.totalBudget} />

              {(p.startDate || p.endDate) && (
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  {p.startDate && (
                    <div style={{ fontSize: 10, color: color.muted }}>
                      Start: <span style={{ color: color.ink }}>{p.startDate}</span>
                    </div>
                  )}
                  {p.endDate && (
                    <div style={{ fontSize: 10, color: color.muted }}>
                      End: <span style={{ color: color.ink }}>{p.endDate}</span>
                    </div>
                  )}
                </div>
              )}

              {pct >= 80 && (
                <div style={{
                  marginTop: 10, padding: '6px 10px', borderRadius: 8,
                  background: pct >= 95 ? '#FFF5F5' : '#FEF3C7',
                  border: `1px solid ${pct >= 95 ? '#FCA5A5' : '#FCD34D'}`,
                  fontSize: 10, color: pct >= 95 ? color.error : color.warning,
                }}>
                  {pct >= 95 ? '⚠️ Budget nearly exhausted' : '⚡ Over 80% of budget used'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
