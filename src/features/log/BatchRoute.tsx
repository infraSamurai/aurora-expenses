import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { BatchReview } from './BatchReview'

export function BatchRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const ids = (location.state as { ids?: string[] } | null)?.ids ?? []

  if (ids.length === 0) return <Navigate to="/today" replace />

  const goHome = () => navigate('/today')
  return <BatchReview queueItemIds={ids} onDone={goHome} onBack={goHome} />
}
