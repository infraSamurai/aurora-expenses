import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ReceiptQueueItem, ExtractedExpense } from '../lib/types'

const MAX_ATTEMPTS = 3

/** 4xx errors are client errors — retrying won't help. Only retry on 5xx/network failures. */
function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    // Supabase FunctionsHttpError includes status in message like "Edge Function returned a non-2xx status code"
    // Check for explicit 4xx status codes
    const msg = err.message.toLowerCase()
    if (msg.includes('400') || msg.includes('413') || msg.includes('415') || msg.includes('422')) {
      return false
    }
  }
  return true
}
const QUEUE_KEY = ['receipt_queue'] as const

// ── Row mapper ─────────────────────────────────────────────────────────────────

function toItem(row: Record<string, unknown>): ReceiptQueueItem {
  return {
    id:         row.id as string,
    receiptUrl: row.receipt_url as string,
    status:     row.status as ReceiptQueueItem['status'],
    attempts:   Number(row.attempts),
    lastError:  row.last_error as string | undefined,
    extracted:  row.extracted as ExtractedExpense | undefined,
    createdAt:  row.created_at as string,
  }
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useReceiptQueue() {
  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: async (): Promise<ReceiptQueueItem[]> => {
      const { data, error } = await supabase
        .from('receipt_queue')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []).map(row => toItem(row as Record<string, unknown>))
    },
    refetchInterval: 4_000,
    staleTime: 0,
  })
}

// ── Mutations ──────────────────────────────────────────────────────────────────

/** Upload file → storage, then enqueue for extraction. Returns queue item id + receiptUrl. */
export function useEnqueueReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      contentType,
      ext,
    }: {
      file: File
      contentType: string
      ext: string
    }): Promise<{ queueItemId: string; receiptUrl: string }> => {
      // UUID path — prevents guessable sequential URLs (security fix #1)
      const path = `receipts/${crypto.randomUUID()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('receipts')
        .upload(path, file, { contentType })
      if (upErr) throw upErr

      const receiptUrl = supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl

      const { data, error } = await supabase
        .from('receipt_queue')
        .insert({ receipt_url: receiptUrl })
        .select()
        .single()
      if (error) throw new Error(error.message)

      return { queueItemId: (data as Record<string, unknown>).id as string, receiptUrl }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUEUE_KEY }),
  })
}

/** Upload multiple files in parallel and enqueue all for extraction. */
export function useBatchEnqueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      files: { file: File; contentType: string; ext: string }[]
    ): Promise<string[]> => {
      const results = await Promise.all(
        files.map(async ({ file, contentType, ext }) => {
          const path = `receipts/${crypto.randomUUID()}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('receipts')
            .upload(path, file, { contentType })
          if (upErr) throw upErr

          const receiptUrl = supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl

          const { data, error } = await supabase
            .from('receipt_queue')
            .insert({ receipt_url: receiptUrl })
            .select()
            .single()
          if (error) throw new Error(error.message)
          return (data as Record<string, unknown>).id as string
        })
      )
      return results
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUEUE_KEY }),
  })
}

/** Mark a queue item done (called from LogExpense fast-path after inline extraction). */
export function useMarkQueueItemDone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, extracted }: { id: string; extracted: ExtractedExpense }) => {
      const { error } = await supabase
        .from('receipt_queue')
        .update({ status: 'done', extracted })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUEUE_KEY }),
  })
}

/** Remove a queue item — called after user confirms and expense is saved. */
export function useDeleteQueueItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('receipt_queue')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUEUE_KEY }),
  })
}

// ── Background processor ───────────────────────────────────────────────────────

/**
 * Mount once at app root. Picks up 'pending' queue items and extracts them in the
 * background, with retry up to MAX_ATTEMPTS. Safe to render multiple times — a ref
 * prevents concurrent extraction runs.
 */
export function useQueueProcessor() {
  const { data: items = [] } = useReceiptQueue()
  const qc = useQueryClient()
  const runningRef = useRef(false)

  useEffect(() => {
    if (runningRef.current) return

    const pending = items.find(i => i.status === 'pending')
    if (!pending) return

    runningRef.current = true

    const run = async () => {
      // Lock the item so other sessions don't double-process
      await supabase
        .from('receipt_queue')
        .update({ status: 'processing' })
        .eq('id', pending.id)

      try {
        const res = await supabase.functions.invoke('extract-receipt', {
          body: { imageUrl: pending.receiptUrl },
        })
        if (res.error) throw res.error

        await supabase
          .from('receipt_queue')
          .update({ status: 'done', extracted: res.data })
          .eq('id', pending.id)
      } catch (err) {
        const nextAttempts = pending.attempts + 1
        // Don't retry 4xx errors (client errors) — mark failed immediately
        const exhausted = nextAttempts >= MAX_ATTEMPTS || !isRetryable(err)
        await supabase
          .from('receipt_queue')
          .update({
            status:     exhausted ? 'failed' : 'pending',
            attempts:   nextAttempts,
            last_error: err instanceof Error ? err.message : 'Unknown error',
          })
          .eq('id', pending.id)
      } finally {
        runningRef.current = false
        qc.invalidateQueries({ queryKey: QUEUE_KEY })
      }
    }

    run()
  })
}

// ── Derived stats ──────────────────────────────────────────────────────────────

export function queueStats(items: ReceiptQueueItem[]) {
  return {
    pending:    items.filter(i => i.status === 'pending' || i.status === 'processing').length,
    readyCount: items.filter(i => i.status === 'done').length,
    failedCount: items.filter(i => i.status === 'failed').length,
    doneItems:  items.filter(i => i.status === 'done'),
    failedItems: items.filter(i => i.status === 'failed'),
  }
}
