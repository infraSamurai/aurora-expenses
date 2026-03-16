import type { KPI, FeeRecord, MonthlyFinancial, ExpenseBreakdown } from '../types'

export const pulseKPIs: KPI[] = [
  { id: 'enrolled',    label: 'Students Enrolled',    value: '347',   subtext: '↑ +23 from last year',    status: 'green', trend: '↑' },
  { id: 'collection',  label: 'Fee Collection (MTD)', value: '94%',   subtext: 'Target: 92%',              status: 'green', trend: '↑' },
  { id: 'cash',        label: 'Cash Reserve',         value: '2.4 mo', subtext: 'Minimum target: 3 mo',   status: 'amber', trend: '↑' },
  { id: 'teacher_att', label: 'Teacher Attendance',   value: '18/19', subtext: '95% — 1 on approved leave', status: 'green', trend: '→' },
  { id: 'student_att', label: 'Student Attendance',   value: '91%',   subtext: 'School-wide today',        status: 'green', trend: '→' },
  { id: 'dues',        label: 'Outstanding Dues',     value: '₹1.2L', subtext: '↑ Increasing — review',   status: 'red',   trend: '↓' },
  { id: 'inquiries',   label: 'New Inquiries',        value: '14',    subtext: 'This month, target 15+',   status: 'amber', trend: '→' },
  { id: 'vacancies',   label: 'Staff Vacancies',      value: '0',     subtext: 'Fully staffed',            status: 'green', trend: '→' },
  { id: 'compliance',  label: 'Compliance Status',    value: '1 alert', subtext: 'CBSE renewal in 28 days', status: 'amber', trend: '↓' },
  { id: 'pl',          label: 'Monthly P&L',          value: 'Surplus', subtext: '+₹68,400 this month',  status: 'green', trend: '↑' },
]

export const defaulters: FeeRecord[] = [
  { studentId: 'S-204', name: 'Ravi Sharma',       class: 'VIII-A', amount: 18000, daysOverdue: 94, lastPayment: 'Dec 2025' },
  { studentId: 'S-311', name: 'Priya Verma',        class: 'VI-B',  amount: 15000, daysOverdue: 78, lastPayment: 'Jan 2026' },
  { studentId: 'S-089', name: 'Ankit Gupta',        class: 'X-A',   amount: 21000, daysOverdue: 62, lastPayment: 'Jan 2026' },
  { studentId: 'S-156', name: 'Sunita Yadav',       class: 'IV-A',  amount: 12000, daysOverdue: 45, lastPayment: 'Feb 2026' },
  { studentId: 'S-278', name: 'Rahul Tiwari',       class: 'IX-B',  amount: 21000, daysOverdue: 38, lastPayment: 'Feb 2026' },
  { studentId: 'S-042', name: 'Kavita Mishra',      class: 'VII-A', amount: 15000, daysOverdue: 31, lastPayment: 'Feb 2026' },
  { studentId: 'S-391', name: 'Deepak Pandey',      class: 'V-B',   amount: 12000, daysOverdue: 24, lastPayment: 'Feb 2026' },
  { studentId: 'S-167', name: 'Anjali Singh',       class: 'III-A', amount: 10000, daysOverdue: 18, lastPayment: 'Mar 2026' },
]

export const monthlyFinancials: MonthlyFinancial[] = [
  { month: 'Oct 25', revenue: 382000, expenses: 318000, surplus: 64000,  collectionRate: 89 },
  { month: 'Nov 25', revenue: 375000, expenses: 322000, surplus: 53000,  collectionRate: 87 },
  { month: 'Dec 25', revenue: 291000, expenses: 305000, surplus: -14000, collectionRate: 68 },
  { month: 'Jan 26', revenue: 418000, expenses: 327000, surplus: 91000,  collectionRate: 97 },
  { month: 'Feb 26', revenue: 394000, expenses: 319000, surplus: 75000,  collectionRate: 92 },
  { month: 'Mar 26', revenue: 401000, expenses: 332600, surplus: 68400,  collectionRate: 94 },
]

export const expenseBreakdown: ExpenseBreakdown[] = [
  { category: 'Salaries',           amount: 199560, pct: 60, status: 'green' },
  { category: 'Utilities',          amount: 26600,  pct: 8,  status: 'amber' },
  { category: 'Infrastructure',     amount: 23280,  pct: 7,  status: 'green' },
  { category: 'Teaching Materials', amount: 13300,  pct: 4,  status: 'green' },
  { category: 'Marketing',          amount: 9960,   pct: 3,  status: 'green' },
  { category: 'Admin & Other',      amount: 59900,  pct: 18, status: 'green' },
]
