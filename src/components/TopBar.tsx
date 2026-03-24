import { Bell } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { color, font } from '../tokens'

interface Props {
  onBell: () => void
}

export function TopBar({ onBell }: Props) {
  const { data: notifications = [] } = useNotifications()
  const unread = notifications.filter(n => !n.isRead).length

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      background: color.white,
      borderBottom: `1px solid ${color.border}`,
      flexShrink: 0,
    }}>
      <div style={{ fontFamily: font.display, fontSize: 17 }}>
        <span style={{ color: color.ink }}>Aurora </span>
        <span style={{ color: color.accent }}>Expenses</span>
      </div>

      <button onClick={onBell} style={{
        position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6,
      }}>
        <Bell size={20} color={color.ink2} strokeWidth={1.8} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: color.error, border: `1.5px solid ${color.white}`,
          }} />
        )}
      </button>
    </header>
  )
}
