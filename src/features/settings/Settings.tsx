import { useCategories } from '../../hooks/useCategories'
import { formatINR } from '../../lib/format'
import { color, font } from '../../tokens'

const TYPE_LABEL = {
  operational: 'Operational',
  capital:     'Capital',
  recurring:   'Recurring',
}

export function Settings() {
  const { data: categories = [], isLoading } = useCategories()

  const grouped = categories.reduce<Record<string, typeof categories>>((acc, c) => {
    const g = acc[c.type] ?? []
    return { ...acc, [c.type]: [...g, c] }
  }, {})

  return (
    <div style={{ background: color.parchment, minHeight: '100%', paddingBottom: 80, fontFamily: font.body }}>

      {/* Header */}
      <div style={{ background: color.white, borderBottom: `1px solid ${color.border}`, padding: '16px 16px 12px' }}>
        <div style={{ fontSize: 18, fontFamily: font.display, fontWeight: 700, color: color.ink }}>
          Settings
        </div>
        <div style={{ fontSize: 11, color: color.muted, marginTop: 2 }}>Categories &amp; budgets</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {isLoading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>Loading…</div>
        )}

        {(['operational', 'capital', 'recurring'] as const).map(type => {
          const cats = grouped[type] ?? []
          if (cats.length === 0) return null
          return (
            <div key={type} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: color.muted, marginBottom: 8,
              }}>
                {TYPE_LABEL[type]}
              </div>
              <div style={{ background: color.white, border: `1px solid ${color.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {cats.map((c, i) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i < cats.length - 1 ? `1px solid ${color.border}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${c.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                      }}>
                        {c.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: color.ink }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: color.muted, marginTop: 1 }}>
                          {c.isActive ? 'Active' : 'Inactive'} · sort {c.sortOrder}
                        </div>
                      </div>
                    </div>
                    {c.monthlyBudget ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: color.ink }}>
                          {formatINR(c.monthlyBudget)}
                        </div>
                        <div style={{ fontSize: 9, color: color.muted }}>/ month</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: color.muted }}>No budget set</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* App info */}
        <div style={{
          marginTop: 8, padding: '14px 16px', background: color.white,
          border: `1px solid ${color.border}`, borderRadius: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: color.ink, marginBottom: 8 }}>About</div>
          <div style={{ fontSize: 11, color: color.muted, lineHeight: 1.6 }}>
            Aurora Expenses — Thread School, Varanasi<br />
            AI-powered receipt capture + vendor tracking
          </div>
        </div>
      </div>
    </div>
  )
}
