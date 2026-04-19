import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell, BareShell } from './AppShell'
import { TodayRoute } from './features/today/TodayRoute'
import { Ask } from './features/ask/Ask'
import { ExpenseList } from './features/expenses/ExpenseList'
import { Settings } from './features/settings/Settings'
import { Projects } from './features/projects/Projects'
import { Vendors } from './features/vendors/Vendors'
import { Reports } from './features/reports/Reports'
import { LogRoute } from './features/log/LogRoute'
import { BatchRoute } from './features/log/BatchRoute'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: '/today', element: <TodayRoute /> },
      { path: '/ask', element: <Ask /> },
      { path: '/books', element: <ExpenseList /> },
      // Legacy views — reachable by URL, folded into Books in phase 2
      { path: '/books/projects', element: <Projects /> },
      { path: '/books/vendors', element: <Vendors /> },
      { path: '/books/reports', element: <Reports /> },
      { path: '/books/operational', element: <ExpenseList defaultType="operational" /> },
      { path: '/books/recurring', element: <ExpenseList defaultType="recurring" /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  {
    element: <BareShell />,
    children: [
      { path: '/log', element: <LogRoute /> },
      { path: '/log/review/:queueId', element: <LogRoute /> },
      { path: '/log/batch', element: <BatchRoute /> },
    ],
  },
  { path: '*', element: <Navigate to="/today" replace /> },
])
