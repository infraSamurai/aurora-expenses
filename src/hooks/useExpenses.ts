import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  Expense, ExpenseCategory, ExpenseFilters,
  CreateExpenseInput, PaymentMethod, PaymentStatus,
} from '../lib/types'

function toExpense(row: Record<string, unknown>): Expense {
  const cat = row.expense_categories as Record<string, unknown> | null | undefined
  return {
    id:            row.id as string,
    amount:        Number(row.amount),
    vendor:        row.vendor as string | undefined,
    description:   row.description as string | undefined,
    date:          row.date as string,
    categoryId:    row.category_id as string | undefined,
    projectId:     row.project_id as string | undefined,
    paymentMethod: row.payment_method as PaymentMethod | undefined,
    paymentStatus: (row.payment_status as PaymentStatus | undefined) ?? 'paid',
    receiptUrl:    row.receipt_url as string | undefined,
    aiExtracted:   Boolean(row.ai_extracted),
    notes:         row.notes as string | undefined,
    createdAt:     row.created_at as string,
    category: cat ? {
      name:  cat.name as string,
      icon:  cat.icon as string,
      color: cat.color as string,
      type:  cat.type as ExpenseCategory['type'],
    } : undefined,
  }
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      let q = supabase
        .from('expenses')
        .select('*, expense_categories(name,icon,color,type)')
        .order('date', { ascending: false })

      if (filters.month) {
        // Compute actual last day — avoids dropping Feb/30-day month expenses
        const lastDay = new Date(`${filters.month}-01`)
        lastDay.setMonth(lastDay.getMonth() + 1)
        lastDay.setDate(0)
        const monthEnd = lastDay.toISOString().slice(0, 10)
        q = q.gte('date', `${filters.month}-01`).lte('date', monthEnd)
      }
      if (filters.categoryId)    q = q.eq('category_id', filters.categoryId)
      if (filters.paymentStatus) q = q.eq('payment_status', filters.paymentStatus)
      if (filters.vendor)        q = q.ilike('vendor', `%${filters.vendor}%`)
      if (filters.limit)         q = q.limit(filters.limit)

      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []).map(toExpense)
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateExpenseInput): Promise<Expense> => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          amount:          input.amount,
          vendor:          input.vendor,
          description:     input.description,
          date:            input.date,
          category_id:     input.categoryId,
          project_id:      input.projectId,
          payment_method:  input.paymentMethod,
          payment_status:  input.paymentStatus,
          receipt_url:     input.receiptUrl,
          ai_extracted:    input.aiExtracted,
          notes:           input.notes,
        })
        .select('*, expense_categories(name,icon,color,type)')
        .single()
      if (error) throw new Error(error.message)
      return toExpense(data as Record<string, unknown>)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentStatus }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ payment_status: status })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}
