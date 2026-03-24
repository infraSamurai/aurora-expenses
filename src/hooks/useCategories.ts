import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ExpenseCategory } from '../lib/types'

function toCategory(row: Record<string, unknown>): ExpenseCategory {
  return {
    id:            row.id as string,
    name:          row.name as string,
    icon:          row.icon as string,
    color:         row.color as string,
    type:          row.type as ExpenseCategory['type'],
    monthlyBudget: row.monthly_budget as number | undefined,
    sortOrder:     Number(row.sort_order ?? 0),
    isActive:      Boolean(row.is_active ?? true),
  }
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw new Error(error.message)
      return (data ?? []).map(toCategory)
    },
    staleTime: 5 * 60_000,
  })
}
