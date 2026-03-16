export type Status = 'green' | 'amber' | 'red'

export interface KPI {
  id: string
  label: string
  value: string
  subtext: string
  status: Status
  trend?: string
}

export interface FeeRecord {
  studentId: string
  name: string
  class: string
  amount: number
  daysOverdue: number
  lastPayment: string
}

export interface MonthlyFinancial {
  month: string
  revenue: number
  expenses: number
  surplus: number
  collectionRate: number
}

export interface ExpenseBreakdown {
  category: string
  amount: number
  pct: number
  status: Status
}
