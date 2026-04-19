import { NavLink, useNavigate } from 'react-router-dom'
import { Home, MessageSquare, BookOpen, Settings as SettingsIcon, Plus, Download } from 'lucide-react'
import { color, font } from '../tokens'

interface RailTab {
  to: string
  label: string
  Icon: typeof Home
}

const TABS: RailTab[] = [
  { to: '/today', label: 'Today', Icon: Home },
  { to: '/ask',   label: 'Ask',   Icon: MessageSquare },
  { to: '/books', label: 'Books', Icon: BookOpen },
]

interface Props {
  onExport: () => void
}

export function AppRail({ onExport }: Props) {
  const navigate = useNavigate()

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: color.ink,
      display: 'flex', flexDirection: 'column',
      padding: '24px 0 16px',
      height: '100%',
      fontFamily: font.body,
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

      {/* Log CTA */}
      <div style={{ padding: '12px 12px 10px' }}>
        <button
          onClick={() => navigate('/log')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px', background: color.accent, border: 'none', borderRadius: 8,
            color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.body,
          }}
        >
          <Plus size={13} />
          Log expense
        </button>
      </div>

      {/* Primary tabs */}
      <div style={{ flex: 1, paddingTop: 4 }}>
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
                background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                borderLeft: `3px solid ${isActive ? '#D4A853' : 'transparent'}`,
                paddingLeft: 15,
              }}>
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </div>
            )}
          </NavLink>
        ))}

        {/* Export (utility) */}
        <button
          onClick={onExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12, fontFamily: font.body, marginTop: 8,
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Settings + user footer */}
      <NavLink to="/settings" style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
            color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
            fontSize: 12, fontWeight: isActive ? 500 : 400,
            background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
          }}>
            <SettingsIcon size={14} />
            Settings
          </div>
        )}
      </NavLink>

      <div style={{
        padding: '12px 18px 0', marginTop: 4,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
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
