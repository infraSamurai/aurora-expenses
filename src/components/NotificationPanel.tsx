import { useEffect } from 'react'
import { Bell, X, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications'
import type { ExpenseNotification } from '../hooks/useNotifications'
import { color, font } from '../tokens'

const LEVEL_STYLE: Record<ExpenseNotification['level'], { border: string; bg: string; Icon: typeof AlertCircle; iconColor: string }> = {
  red:   { border: color.error,   bg: color.errorLight,   Icon: AlertCircle,   iconColor: color.error   },
  amber: { border: color.warning, bg: color.warningLight, Icon: AlertTriangle, iconColor: color.warning },
  green: { border: color.success, bg: '#F0FDF4',          Icon: Info,          iconColor: color.success },
  info:  { border: color.accent,  bg: color.white,        Icon: Info,          iconColor: color.accent  },
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: Props) {
  const { data: notifications = [] } = useNotifications()
  const markRead    = useMarkRead()
  const markAllRead = useMarkAllRead()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const unread  = notifications.filter(n => !n.isRead).length
  const alerts  = notifications.filter(n => n.type === 'alert')
  const notifs  = notifications.filter(n => n.type === 'notification')
  const recoms  = notifications.filter(n => n.type === 'recommendation')

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(26,23,20,0.4)',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 360, zIndex: 51,
        background: color.white,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        fontFamily: font.body,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '18px 20px 14px',
          borderBottom: `1px solid ${color.border}`,
          background: color.parchment, flexShrink: 0,
        }}>
          <Bell size={18} color={color.ink2} />
          <span style={{ fontFamily: font.display, fontSize: 15, fontWeight: 600, color: color.ink, flex: 1 }}>
            Updates
          </span>
          {unread > 0 && (
            <div style={{
              background: color.error, color: 'white',
              fontSize: 10, fontWeight: 600,
              width: 20, height: 20, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unread}
            </div>
          )}
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              style={{ fontSize: 11, color: color.accent, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} color={color.muted} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {[
            { label: 'Alerts',          items: alerts },
            { label: 'Notifications',   items: notifs },
            { label: 'Recommendations', items: recoms },
          ].map(({ label, items }) => items.length > 0 && (
            <div key={label}>
              <div style={{
                padding: '14px 20px 8px',
                fontSize: 9, fontWeight: 600, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: color.muted,
              }}>
                {label}
              </div>
              {items.map(n => {
                const { border, bg, Icon, iconColor } = LEVEL_STYLE[n.level]
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markRead.mutate(n.id)}
                    style={{
                      padding: '12px 20px 12px 16px',
                      borderLeft: `3px solid ${n.isRead ? 'transparent' : border}`,
                      background: n.isRead ? color.white : bg,
                      cursor: n.isRead ? 'default' : 'pointer',
                      borderBottom: `1px solid ${color.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Icon size={11} color={iconColor} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: color.ink }}>{n.title}</span>
                    </div>
                    <p style={{ fontSize: 11, color: color.ink2, lineHeight: 1.45, margin: 0 }}>{n.body}</p>
                    <p style={{ fontSize: 10, color: color.muted, marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          ))}

          {notifications.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: color.muted, fontSize: 13 }}>
              No notifications yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', background: color.parchment,
          borderTop: `1px solid ${color.border}`, textAlign: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: color.accent }}>View all activity</span>
        </div>
      </div>
    </>
  )
}
