import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { VendorSummary } from '../lib/types'

function toVendorSummary(row: Record<string, unknown>): VendorSummary {
  return {
    vendor:          row.vendor as string,
    totalCount:      Number(row.total_count),
    totalAmount:     Number(row.total_amount),
    pendingAmount:   Number(row.pending_amount ?? 0),
    billedAmount:    Number(row.billed_amount ?? 0),
    paidAmount:      Number(row.paid_amount ?? 0),
    pendingCount:    Number(row.pending_count ?? 0),
    billedCount:     Number(row.billed_count ?? 0),
    lastTransaction: row.last_transaction as string,
  }
}

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vendor_summary').select('*')
      if (error) throw new Error(error.message)
      return (data ?? []).map(toVendorSummary)
    },
    staleTime: 60_000,
  })
}
