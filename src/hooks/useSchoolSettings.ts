import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const SETTINGS_KEY = ['school_settings'] as const

async function fetchSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('school_settings')
    .select('key, value')
  if (error) throw new Error(error.message)
  return Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
}

export function useSchoolSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
    staleTime: 5 * 60_000, // settings rarely change — cache 5 minutes
  })
}

/** Typed helpers derived from the raw key-value store */
export function useMonthlyBudget(): number {
  const { data } = useSchoolSettings()
  return data?.monthly_budget ? Number(data.monthly_budget) : 340_000
}

export function useUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('school_settings')
        .upsert({ key, value })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  })
}
