import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { color } from './tokens'

// Layout components
import { Sidebar } from './components/Sidebar'
import { MobileNav } from './components/MobileNav'
import { TopBar } from './components/TopBar'
import { NotificationPanel } from './components/NotificationPanel'

// Feature pages
import { Dashboard } from './features/home/Dashboard'
import { LogExpense } from './features/log/LogExpense'
import { ExpenseList } from './features/expenses/ExpenseList'
import { Reports } from './features/reports/Reports'
import { Projects } from './features/projects/Projects'
import { Vendors } from './features/vendors/Vendors'
import { Settings } from './features/settings/Settings'

// Queue
import { useQueueProcessor } from './hooks/useReceiptQueue'
import type { ReceiptQueueItem } from './lib/types'

// Batch review
import { BatchReview } from './features/log/BatchReview'

export type Page =
  | 'dashboard'
  | 'expenses'
  | 'log'
  | 'batch'
  | 'reports'
  | 'projects'
  | 'vendors'
  | 'operational'
  | 'capital'
  | 'recurring'
  | 'settings'

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

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

function PageContent({
  page, setPage, reviewQueueItem, setReviewQueueItem, batchIds, setBatchIds,
}: {
  page: Page
  setPage: (p: Page) => void
  reviewQueueItem: ReceiptQueueItem | undefined
  setReviewQueueItem: (item: ReceiptQueueItem | undefined) => void
  batchIds: string[]
  setBatchIds: (ids: string[]) => void
}) {
  const handleReview = (item: ReceiptQueueItem) => {
    setReviewQueueItem(item)
    setPage('log')
  }
  const handleLogBack = () => {
    setReviewQueueItem(undefined)
    setPage('dashboard')
  }
  const handleBatchReady = (ids: string[]) => {
    setBatchIds(ids)
    setPage('batch')
  }

  if (page === 'batch') {
    return (
      <BatchReview
        queueItemIds={batchIds}
        onDone={() => { setBatchIds([]); setPage('dashboard') }}
        onBack={() => { setBatchIds([]); setPage('dashboard') }}
      />
    )
  }

  switch (page) {
    case 'dashboard':   return <Dashboard onReviewQueueItem={handleReview} />
    case 'log':         return <LogExpense onBack={handleLogBack} reviewQueueItem={reviewQueueItem} onBatchReady={handleBatchReady} />
    case 'expenses':    return <ExpenseList />
    case 'reports':     return <Reports />
    case 'projects':    return <Projects />
    case 'vendors':     return <Vendors />
    case 'operational': return <ExpenseList defaultType="operational" />
    case 'capital':     return <Projects />
    case 'recurring':   return <ExpenseList defaultType="recurring" />
    case 'settings':    return <Settings />
    default:            return <Dashboard onReviewQueueItem={handleReview} />
  }
}

function AppShell() {
  const [page, setPage]                       = useState<Page>('dashboard')
  const [showBell, setShowBell]               = useState(false)
  const [reviewQueueItem, setReviewQueueItem] = useState<ReceiptQueueItem | undefined>()
  const [batchIds, setBatchIds]               = useState<string[]>([])
  const isDesktop                             = useIsDesktop()

  // Background receipt extraction processor
  useQueueProcessor()

  const handleExport = async () => {
    alert('Export CSV: coming soon — will download all expenses as CSV')
  }

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: color.parchment }}>
        <Sidebar
          page={page}
          setPage={setPage}
          onLogExpense={() => setPage('log')}
          onExport={handleExport}
        />
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <PageContent page={page} setPage={setPage} reviewQueueItem={reviewQueueItem} setReviewQueueItem={setReviewQueueItem} batchIds={batchIds} setBatchIds={setBatchIds} />
        </main>
        <NotificationPanel open={showBell} onClose={() => setShowBell(false)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: color.parchment }}>
      <TopBar onBell={() => setShowBell(true)} />
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <PageContent page={page} setPage={setPage} reviewQueueItem={reviewQueueItem} setReviewQueueItem={setReviewQueueItem} batchIds={batchIds} setBatchIds={setBatchIds} />
      </main>
      <MobileNav page={page} setPage={setPage} />
      <NotificationPanel open={showBell} onClose={() => setShowBell(false)} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AppShell />
    </QueryClientProvider>
  )
}
