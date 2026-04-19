import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AppRail } from './components/AppRail'
import { AppTabs } from './components/AppTabs'
import { TopBar } from './components/TopBar'
import { NotificationPanel } from './components/NotificationPanel'
import { useQueueProcessor } from './hooks/useReceiptQueue'
import { color } from './tokens'

function useIsDesktop() {
  const [desk, setDesk] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setDesk(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return desk
}

/** Full-chrome shell: rail/tabs + main content. Used for Today/Ask/Books/Settings. */
export function AppShell() {
  const [showBell, setShowBell] = useState(false)
  const isDesktop = useIsDesktop()

  // Background receipt extraction processor
  useQueueProcessor()

  const handleExport = () => {
    alert('Export CSV: coming soon — will download all expenses as CSV')
  }

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: color.parchment }}>
        <AppRail onExport={handleExport} />
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <Outlet />
        </main>
        <NotificationPanel open={showBell} onClose={() => setShowBell(false)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: color.parchment }}>
      <TopBar onBell={() => setShowBell(true)} />
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>
      <AppTabs />
      <NotificationPanel open={showBell} onClose={() => setShowBell(false)} />
    </div>
  )
}

/** Bare shell: full-bleed content, no nav chrome. Used for the Log capture flow. */
export function BareShell() {
  useQueueProcessor()
  return (
    <div style={{ height: '100svh', background: color.parchment }}>
      <Outlet />
    </div>
  )
}
