import { useNavigate } from 'react-router-dom'
import { Dashboard } from '../home/Dashboard'
import type { ReceiptQueueItem } from '../../lib/types'

export function TodayRoute() {
  const navigate = useNavigate()
  const handleReview = (item: ReceiptQueueItem) => {
    navigate(`/log/review/${item.id}`, { state: { queueItem: item } })
  }
  return <Dashboard onReviewQueueItem={handleReview} />
}
