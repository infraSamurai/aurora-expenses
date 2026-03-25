import { useState, useEffect } from 'react'
import { ChevronLeft, Check, Merge } from 'lucide-react'
import { useReceiptQueue, useDeleteQueueItem } from '../../hooks/useReceiptQueue'
import { useCreateExpense } from '../../hooks/useExpenses'
import { useCategories } from '../../hooks/useCategories'
import { todayISO, formatINR } from '../../lib/format'
import { color, font } from '../../tokens'
import type { ReceiptQueueItem, CreateExpenseInput, PaymentStatus } from '../../lib/types'

// ── Grouping logic ─────────────────────────────────────────────────────────────

interface Group {
  key: string
  items: ReceiptQueueItem[]
  /** True if multiple items share same vendor + date → suggest merge */
  suggestMerge: boolean
  vendor: string | null
  date: string | null
  totalAmount: number
}

function groupItems(items: ReceiptQueueItem[]): Group[] {
  const buckets = new Map<string, ReceiptQueueItem[]>()

  for (const item of items) {
    const vendor = (item.extracted?.vendor ?? '').toLowerCase().trim()
    const date   = item.extracted?.date ?? ''
    // Only group when vendor AND date both present — ambiguous ones stay solo
    const key = (vendor && date) ? `${vendor}::${date}` : `solo::${item.id}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(item)
  }

  return Array.from(buckets.entries()).map(([key, grpItems]) => ({
    key,
    items: grpItems,
    suggestMerge: grpItems.length > 1,
    vendor:      grpItems[0].extracted?.vendor ?? null,
    date:        grpItems[0].extracted?.date   ?? null,
    totalAmount: grpItems.reduce((s, i) => s + (i.extracted?.amount ?? 0), 0),
  }))
}

// ── Single item card ───────────────────────────────────────────────────────────

function ItemCard({ item }: { item: ReceiptQueueItem }) {
  const isPending = item.status === 'pending' || item.status === 'processing'
  const isFailed  = item.status === 'failed'

  if (isPending) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', background: color.parchment,
        borderRadius: 8, border: `1px solid ${color.border}`,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${color.accent}`, borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 11, color: color.muted }}>Extracting…</span>
        <img src={item.receiptUrl} alt="" style={{
          width: 36, height: 36, borderRadius: 4, objectFit: 'cover',
          marginLeft: 'auto', flexShrink: 0,
        }} />
      </div>
    )
  }

  if (isFailed) {
    return (
      <div style={{
        padding: '10px 14px', background: '#FEF2F2',
        borderRadius: 8, border: '1px solid #FECACA',
        fontSize: 11, color: '#991B1B',
      }}>
        Extraction failed — will be saved as manual entry
      </div>
    )
  }

  const e = item.extracted!
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: color.white,
      borderRadius: 8, border: `1px solid ${color.border}`,
    }}>
      <img src={item.receiptUrl} alt="" style={{
        width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: color.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {e.vendor ?? 'Unknown vendor'}
        </div>
        <div style={{ fontSize: 10, color: color.muted, marginTop: 1 }}>
          {e.date ?? todayISO()} · {e.suggestedCategoryName ?? 'Uncategorised'}
        </div>
      </div>
      <div style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: color.accent, flexShrink: 0 }}>
        {formatINR(e.amount ?? 0)}
      </div>
    </div>
  )
}

// ── Group card ─────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  merged,
  onToggleMerge,
  saved,
}: {
  group: Group
  merged: boolean
  onToggleMerge: () => void
  saved: boolean
}) {
  const allDone = group.items.every(i => i.status === 'done' || i.status === 'failed')

  return (
    <div style={{
      background: color.white,
      border: `1.5px solid ${saved ? color.success : group.suggestMerge && merged ? color.accent : color.border}`,
      borderRadius: 12, overflow: 'hidden',
      opacity: saved ? 0.6 : 1,
    }}>
      {/* Group header */}
      <div style={{
        padding: '10px 14px',
        background: group.suggestMerge ? color.accentLight : color.parchment,
        borderBottom: `1px solid ${color.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ minWidth: 0 }}>
          {group.suggestMerge ? (
            <div style={{ fontSize: 11, fontWeight: 700, color: color.accent }}>
              {group.items.length} receipts · same vendor + date
            </div>
          ) : (
            <div style={{ fontSize: 11, color: color.muted }}>
              {group.vendor ?? 'Receipt'}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {saved && <Check size={14} color={color.success} />}

          {group.suggestMerge && !saved && (
            <button
              onClick={onToggleMerge}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6,
                background: merged ? color.accent : 'transparent',
                border: `1px solid ${merged ? color.accent : color.border}`,
                color: merged ? 'white' : color.muted,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                fontFamily: font.body,
              }}
            >
              <Merge size={10} />
              {merged ? 'Merged' : 'Merge'}
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {group.items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Merged total */}
      {group.suggestMerge && merged && allDone && (
        <div style={{
          padding: '8px 14px',
          borderTop: `1px solid ${color.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: color.accentLight,
        }}>
          <span style={{ fontSize: 11, color: color.accent, fontWeight: 600 }}>
            Will save as 1 expense
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 14, fontWeight: 700, color: color.accent }}>
            {formatINR(group.totalAmount)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main BatchReview ───────────────────────────────────────────────────────────

export function BatchReview({
  queueItemIds,
  onDone,
  onBack,
}: {
  queueItemIds: string[]
  onDone: () => void
  onBack: () => void
}) {
  const { data: allItems = [] } = useReceiptQueue()
  const createExpense   = useCreateExpense()
  const deleteQueueItem = useDeleteQueueItem()
  const { data: categories = [] } = useCategories()

  // Filter to just the items in this batch
  const batchItems = allItems.filter(i => queueItemIds.includes(i.id))
  const groups     = groupItems(batchItems)

  const allExtracted = batchItems.every(i => i.status === 'done' || i.status === 'failed')
  const pendingCount = batchItems.filter(i => i.status === 'pending' || i.status === 'processing').length

  // Track which groups are set to merge (default: merge all suggested groups)
  const [mergedKeys, setMergedKeys] = useState<Set<string>>(() => {
    const s = new Set<string>()
    groups.forEach(g => { if (g.suggestMerge) s.add(g.key) })
    return s
  })

  // Auto-merge new suggested groups as extraction completes
  useEffect(() => {
    setMergedKeys(prev => {
      const next = new Set(prev)
      groups.forEach(g => { if (g.suggestMerge && !next.has(g.key)) next.add(g.key) })
      return next
    })
  }, [groups.map(g => g.key).join(',')])

  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [saving, setSaving]       = useState(false)

  const handleSaveAll = async () => {
    setSaving(true)

    for (const group of groups) {
      if (savedKeys.has(group.key)) continue
      const doneItems = group.items.filter(i => i.status === 'done' && i.extracted)
      if (doneItems.length === 0) continue

      const isMerged = mergedKeys.has(group.key) && group.suggestMerge

      if (isMerged) {
        // Save one combined expense
        const first = doneItems[0].extracted!
        const total = doneItems.reduce((s, i) => s + (i.extracted?.amount ?? 0), 0)
        const catId = categories.find(
          c => c.name.toLowerCase() === (first.suggestedCategoryName ?? '').toLowerCase()
        )?.id

        const input: CreateExpenseInput = {
          amount:        total,
          vendor:        first.vendor ?? undefined,
          date:          first.date ?? todayISO(),
          categoryId:    catId,
          paymentMethod: first.paymentMethod ?? 'cash',
          paymentStatus: 'pending' as PaymentStatus,
          receiptUrl:    doneItems[0].receiptUrl,
          aiExtracted:   true,
          notes:         doneItems.length > 1 ? `Merged ${doneItems.length} receipts` : undefined,
        }
        await createExpense.mutateAsync(input)
        for (const item of doneItems) deleteQueueItem.mutate(item.id)
      } else {
        // Save each item separately
        for (const item of doneItems) {
          const e = item.extracted!
          const catId = categories.find(
            c => c.name.toLowerCase() === (e.suggestedCategoryName ?? '').toLowerCase()
          )?.id
          const input: CreateExpenseInput = {
            amount:        e.amount ?? 0,
            vendor:        e.vendor ?? undefined,
            date:          e.date ?? todayISO(),
            categoryId:    catId,
            paymentMethod: e.paymentMethod ?? 'cash',
            paymentStatus: 'pending' as PaymentStatus,
            receiptUrl:    item.receiptUrl,
            aiExtracted:   true,
          }
          await createExpense.mutateAsync(input)
          deleteQueueItem.mutate(item.id)
        }
      }

      setSavedKeys(prev => new Set([...prev, group.key]))
    }

    setSaving(false)
    onDone()
  }

  const totalExpenses = groups.reduce((sum, g) => {
    if (mergedKeys.has(g.key) && g.suggestMerge) return sum + 1
    return sum + g.items.filter(i => i.status === 'done').length
  }, 0)

  const totalAmount = batchItems.reduce((s, i) => s + (i.extracted?.amount ?? 0), 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: color.parchment, fontFamily: font.body }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '52px 20px 14px', background: color.white,
        borderBottom: `1px solid ${color.border}`, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ChevronLeft size={20} color={color.ink2} />
        </button>
        <div>
          <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 600, color: color.ink }}>
            Review {batchItems.length} Receipt{batchItems.length > 1 ? 's' : ''}
          </div>
          {pendingCount > 0 && (
            <div style={{ fontSize: 10, color: color.muted, marginTop: 2 }}>
              {pendingCount} still extracting…
            </div>
          )}
        </div>
      </div>

      {/* Summary banner */}
      {allExtracted && totalAmount > 0 && (
        <div style={{
          background: color.ink, padding: '12px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
              {totalExpenses} expense{totalExpenses !== 1 ? 's' : ''} · {batchItems.length} receipt{batchItems.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: 'white', marginTop: 2 }}>
              {formatINR(totalAmount)}
            </div>
          </div>
          {groups.some(g => g.suggestMerge) && (
            <div style={{
              background: `${color.accent}30`, border: `1px solid ${color.accent}50`,
              borderRadius: 6, padding: '4px 10px',
              fontSize: 10, color: color.accent, fontWeight: 600,
            }}>
              Smart merge on
            </div>
          )}
        </div>
      )}

      {/* Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(group => (
          <GroupCard
            key={group.key}
            group={group}
            merged={mergedKeys.has(group.key)}
            onToggleMerge={() => setMergedKeys(prev => {
              const next = new Set(prev)
              next.has(group.key) ? next.delete(group.key) : next.add(group.key)
              return next
            })}
            saved={savedKeys.has(group.key)}
          />
        ))}
      </div>

      {/* Save bar */}
      <div style={{ padding: '12px 16px 28px', flexShrink: 0, background: color.white, borderTop: `1px solid ${color.border}` }}>
        <button
          onClick={handleSaveAll}
          disabled={saving || !allExtracted || totalExpenses === 0}
          style={{
            width: '100%', padding: '13px',
            background: allExtracted && totalExpenses > 0 ? color.accent : color.border,
            border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, color: 'white',
            fontFamily: font.body,
            cursor: allExtracted && totalExpenses > 0 && !saving ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? 'Saving…'
            : !allExtracted
            ? `Extracting… (${pendingCount} left)`
            : `Save ${totalExpenses} Expense${totalExpenses !== 1 ? 's' : ''} · ${formatINR(totalAmount)}`
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
