import { Home, List, Plus, BarChart2, FolderOpen } from 'lucide-react'
import { color, font } from '../tokens'
import type { Page } from '../App'

const TABS = [
  { id: 'dashboard' as Page, label: 'Home',    Icon: Home },
  { id: 'expenses'  as Page, label: 'List',    Icon: List },
  { id: 'log'       as Page, label: 'Log',     Icon: Plus, accent: true },
  { id: 'reports'   as Page, label: 'Reports', Icon: BarChart2 },
  { id: 'projects'  as Page, label: 'Budget',  Icon: FolderOpen },
]

interface Props {
  page: Page
  setPage: (p: Page) => void
}

export function MobileNav({ page, setPage }: Props) {
  return (
    <nav style={{
      display: 'flex', background: color.white,
      borderTop: `1px solid ${color.border}`,
      position: 'sticky', bottom: 0, zIndex: 40,
      fontFamily: font.body,
    }}>
      {TABS.map(({ id, label, Icon, accent }) => {
        const active = page === id
        const c = active || accent ? color.accent : color.muted
        return (
          <button
            key={id}
            onClick={() => setPage(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 4px', gap: 3,
              background: accent && active ? `${color.accent}10` : 'none',
              border: 'none', cursor: 'pointer',
            }}
          >
            {accent ? (
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: color.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${color.accent}60`,
                marginTop: -12,
              }}>
                <Icon size={18} color="white" strokeWidth={2.5} />
              </div>
            ) : (
              <Icon size={20} color={c} strokeWidth={active ? 2.5 : 1.8} />
            )}
            <span style={{ fontSize: 9, color: accent ? color.accent : c, fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
