import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ExpenseProject } from '../lib/types'

function toProject(row: Record<string, unknown>): ExpenseProject {
  return {
    id:           row.id as string,
    name:         row.name as string,
    description:  row.description as string | undefined,
    totalBudget:  Number(row.total_budget),
    startDate:    row.start_date as string | undefined,
    endDate:      row.end_date as string | undefined,
    status:       row.status as ExpenseProject['status'],
    createdAt:    row.created_at as string,
  }
}

export function useProjects(status: 'active' | 'all' = 'active') {
  return useQuery({
    queryKey: ['projects', status],
    queryFn: async () => {
      let q = supabase.from('expense_projects').select('*').order('created_at')
      if (status === 'active') q = q.eq('status', 'active')
      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []).map(toProject)
    },
    staleTime: 2 * 60_000,
  })
}
