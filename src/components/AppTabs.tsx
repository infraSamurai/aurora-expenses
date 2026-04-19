import { NavLink, useNavigate } from 'react-router-dom'
import { Home, MessageSquare, BookOpen, Plus } from 'lucide-react'
import { color, font } from '../tokens'

interface Tab {
  to: string
  label: string
  Icon: typeof Home
}

const TABS: Tab[] = [
  { to: '/today', label: 'Today', Icon: Home },
  { to: '/ask',   label: 'Ask',   Icon: MessageSquare },
  { to: '/books', label: 'Books', Icon: BookOpen },
]

export function AppTabs() {
  const navigate = useNavigate()

  return (
    <nav style={{
      display: 'flex', background: color.white,
      borderTop: `1px solid ${color.border}`,
      position: 'sticky', bottom: 0, zIndex: 40,
      fontFamily: font.body,
    }}>
      {/* First half: Today | Ask */}
      {TABS.slice(0, 2).map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={{ flex: 1, textDecoration: 'none', display: 'block' }}
        >
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 4px', gap: 3,
            }}>
              <Icon size={20} color={isActive ? color.accent : color.muted} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: 9, color: isActive ? color.accent : color.muted, fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}

      {/* Center FAB → Log */}
      <button
        onClick={() => navigate('/log')}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8px 4px', gap: 3,
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: color.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 20px ${color.accent}60`,
          marginTop: -14,
        }}>
          <Plus size={20} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 9, color: color.accent, fontWeight: 600 }}>
          Log
        </span>
      </button>

      {/* Last: Books */}
      {TABS.slice(2).map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={{ flex: 1, textDecoration: 'none', display: 'block' }}
        >
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 4px', gap: 3,
            }}>
              <Icon size={20} color={isActive ? color.accent : color.muted} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: 9, color: isActive ? color.accent : color.muted, fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
