import { LayoutDashboard, List, BarChart2, FolderOpen, Store, Plus, Download } from 'lucide-react'
import { color, font } from '../tokens'
import type { Page } from '../App'

const GROUPS: {
  label: string
  items: { id: Page; label: string; Icon: typeof LayoutDashboard; dot?: string; badge?: number }[]
}[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
      { id: 'expenses',  label: 'All Expenses', Icon: List },
    ],
  },
  {
    label: 'Categories',
    items: [
      { id: 'operational', label: 'Operational', Icon: LayoutDashboard, dot: color.accent  },
      { id: 'capital',     label: 'Capital',     Icon: LayoutDashboard, dot: color.success },
      { id: 'recurring',   label: 'Recurring',   Icon: LayoutDashboard, dot: color.warning },
    ],
  },
  {
    label: 'Reports',
    items: [
      { id: 'reports',  label: 'Monthly P&L', Icon: BarChart2 },
      { id: 'projects', label: 'Projects',    Icon: FolderOpen },
      { id: 'vendors',  label: 'Vendors',     Icon: Store },
    ],
  },
]

interface Props {
  page: Page
  setPage: (p: Page) => void
  onLogExpense: () => void
  onExport: () => void
}

export function Sidebar({ page, setPage, onLogExpense, onExport }: Props) {
  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: color.ink,
      display: 'flex', flexDirection: 'column',
      padding: '24px 0 16px',
      height: '100%',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
        <div style={{ fontFamily: font.display, fontSize: 17, lineHeight: 1.1 }}>
          <span style={{ color: color.parchment }}>Aurora</span><br />
          <span style={{ color: '#818CF8' }}>Expenses</span>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', marginTop: 6 }}>
          Thread School · Varanasi
        </div>
      </div>

      {/* Log Expense CTA */}
      <div style={{ padding: '12px 12px 4px' }}>
        <button onClick={onLogExpense} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px', background: color.accent, border: 'none', borderRadius: 8,
          color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: font.body,
        }}>
          <Plus size={12} />
          Log Expense
        </button>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, paddingTop: 4, overflowY: 'auto' }}>
        {GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 8.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', padding: '10px 18px 4px',
            }}>
              {group.label}
            </div>
            {group.items.map(({ id, label, Icon, dot }) => {
              const active = page === id
              return (
                <button
                  key={id}
                  onClick={() => setPage(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 18px',
                    width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                    color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.4)',
                    fontSize: 12, fontWeight: active ? 500 : 400, fontFamily: font.body,
                  }}
                >
                  {dot
                    ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    : <Icon size={14} />
                  }
                  {label}
                  {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#D4A853' }} />}
                </button>
              )
            })}
          </div>
        ))}

        {/* Export */}
        <div style={{ marginBottom: 4 }}>
          <button onClick={onExport} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 18px',
            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12, fontFamily: font.body,
          }}>
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* User footer */}
      <div style={{ padding: '12px 18px 0', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg,#4338CA,#818CF8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'white', flexShrink: 0,
        }}>
          F
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Founder</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Admin</div>
        </div>
      </div>
    </aside>
  )
}
