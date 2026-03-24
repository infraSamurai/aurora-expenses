import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface ExpenseNotification {
  id: string
  type: 'alert' | 'notification' | 'recommendation'
  level: 'red' | 'amber' | 'green' | 'info'
  title: string
  body: string
  actionUrl?: string
  expenseId?: string
  isRead: boolean
  createdAt: string
}

function toNotification(row: Record<string, unknown>): ExpenseNotification {
  return {
    id:        row.id as string,
    type:      row.type as ExpenseNotification['type'],
    level:     row.level as ExpenseNotification['level'],
    title:     row.title as string,
    body:      row.body as string,
    actionUrl: row.action_url as string | undefined,
    expenseId: row.expense_id as string | undefined,
    isRead:    Boolean(row.is_read),
    createdAt: row.created_at as string,
  }
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw new Error(error.message)
      return (data ?? []).map(toNotification)
    },
    refetchInterval: 30_000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expense_notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('expense_notifications')
        .update({ is_read: true })
        .eq('is_read', false)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
