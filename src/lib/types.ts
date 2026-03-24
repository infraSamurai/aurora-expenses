// Expense domain types — matches Supabase schema exactly

export type QueueStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface ReceiptQueueItem {
  id: string
  receiptUrl: string
  status: QueueStatus
  attempts: number
  lastError?: string
  extracted?: ExtractedExpense
  createdAt: string
}

export type PaymentMethod  = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other'
export type PaymentStatus  = 'pending' | 'billed' | 'paid'
export type CategoryType   = 'operational' | 'capital' | 'recurring'
export type ProjectStatus  = 'active' | 'completed' | 'paused'

export interface ExpenseCategory {
  id: string
  name: string
  icon: string
  color: string
  type: CategoryType
  monthlyBudget?: number
  sortOrder: number
  isActive: boolean
}

export interface ExpenseProject {
  id: string
  name: string
  description?: string
  totalBudget: number
  startDate?: string
  endDate?: string
  status: ProjectStatus
  createdAt: string
  spentToDate?: number
}

export interface Expense {
  id: string
  amount: number
  vendor?: string
  description?: string
  date: string
  categoryId?: string
  projectId?: string
  paymentMethod?: PaymentMethod
  paymentStatus: PaymentStatus
  receiptUrl?: string
  aiExtracted: boolean
  notes?: string
  createdAt: string
  // joined
  category?: Pick<ExpenseCategory, 'name' | 'icon' | 'color' | 'type'>
}

export interface VendorSummary {
  vendor: string
  totalCount: number
  totalAmount: number
  pendingAmount: number
  billedAmount: number
  paidAmount: number
  pendingCount: number
  billedCount: number
  lastTransaction: string
}

export interface LineItem {
  description: string
  amount: number
}

export interface ExtractedExpense {
  amount: number | null
  vendor: string | null
  date: string | null
  suggestedCategoryName: string | null
  paymentMethod: PaymentMethod | null
  confidence: 'high' | 'medium' | 'low'
  rawText: string
  lineItems?: LineItem[]
}

// Input to create an expense
export interface CreateExpenseInput {
  amount: number
  vendor?: string
  description?: string
  date: string
  categoryId?: string
  projectId?: string
  paymentMethod?: PaymentMethod
  paymentStatus: PaymentStatus
  receiptUrl?: string
  aiExtracted: boolean
  notes?: string
}

export interface ExpenseFilters {
  month?: string
  categoryId?: string
  paymentStatus?: PaymentStatus
  vendor?: string
  limit?: number
}
