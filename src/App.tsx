import { useState } from 'react'
import Sidebar from './components/Sidebar'
import FounderPulse from './pages/FounderPulse'
import Financial from './pages/Financial'
import Enrollment from './pages/Enrollment'
import Compliance from './pages/Compliance'
import './App.css'

type Page = 'pulse' | 'financial' | 'enrollment' | 'compliance'

export default function App() {
  const [page, setPage] = useState<Page>('pulse')

  const content: Record<Page, React.ReactNode> = {
    pulse:      <FounderPulse />,
    financial:  <Financial />,
    enrollment: <Enrollment />,
    compliance: <Compliance />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F7F4EF' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {content[page]}
      </main>
    </div>
  )
}
