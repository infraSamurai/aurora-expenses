import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { LogExpense } from './LogExpense'
import { useReceiptQueue } from '../../hooks/useReceiptQueue'
import type { ReceiptQueueItem } from '../../lib/types'

export function LogRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { queueId } = useParams<{ queueId?: string }>()
  const { data: queueItems = [] } = useReceiptQueue()

  // Prefer queue item from navigation state (fast path from Today),
  // fall back to looking it up by id when the URL is opened cold.
  const stateItem = (location.state as { queueItem?: ReceiptQueueItem } | null)?.queueItem
  const reviewQueueItem = stateItem ?? (queueId ? queueItems.find((i) => i.id === queueId) : undefined)

  const handleBack = () => navigate('/today')
  const handleBatchReady = (ids: string[]) => {
    navigate('/log/batch', { state: { ids } })
  }

  return (
    <LogExpense
      onBack={handleBack}
      reviewQueueItem={reviewQueueItem}
      onBatchReady={handleBatchReady}
    />
  )
}
