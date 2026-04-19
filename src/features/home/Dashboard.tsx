import { useExpenses } from '../../hooks/useExpenses'
import { useReceiptQueue, queueStats } from '../../hooks/useReceiptQueue'
import { useMonthlyBudget } from '../../hooks/useSchoolSettings'
import { ExpenseRow } from '../../components/ExpenseRow'
import { formatINRCompact, currentMonth, monthLabel } from '../../lib/format'
import { color, font } from '../../tokens'
import type { ReceiptQueueItem } from '../../lib/types'

export function Dashboard({ onReviewQueueItem }: { onReviewQueueItem?: (item: ReceiptQueueItem) => void }) {
  const month = currentMonth()
  const { data: expenses = [], isLoading } = useExpenses({ month, limit: 60 })
  const { data: queueItems = [] } = useReceiptQueue()
  const { pending, readyCount, failedCount, doneItems, failedItems } = queueStats(queueItems)
  const BUDGET = useMonthlyBudget()

  const totalSpent  = expenses.reduce((s, e) => s + e.amount, 0)
  const paidAmt     = expenses.filter(e => e.paymentStatus === 'paid').reduce((s, e) => s + e.amount, 0)
  const billedAmt   = expenses.filter(e => e.paymentStatus === 'billed').reduce((s, e) => s + e.amount, 0)
  const pendingAmt  = expenses.filter(e => e.paymentStatus === 'pending').reduce((s, e) => s + e.amount, 0)
  const pctUsed     = Math.min(Math.round((totalSpent / BUDGET) * 100), 100)
  const aiCount     = expenses.filter(e => e.aiExtracted).length
  const aiRate      = expenses.length > 0 ? Math.round((aiCount / expenses.length) * 100) : 0

  const recent = expenses.slice(0, 8)

  return (
    <div style={{ background: color.parchment, minHeight: '100%', paddingBottom: 80, fontFamily: font.body }}>

      {/* Dark header — Monthly spend summary */}
      <div style={{
        background: color.ink, borderRadius: '0 0 24px 24px',
        padding: '52px 20px 22px',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
          {monthLabel(month)}
        </div>
        <div style={{
          fontFamily: font.display, fontSize: 32, fontWeight: 700,
          color: 'white', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6,
        }}>
          {isLoading ? '—' : formatINRCompact(totalSpent)}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
          of {formatINRCompact(BUDGET)} budget · {pctUsed}% used
        </div>

        {/* Segmented budget bar */}
        <div style={{
          height: 5, borderRadius: 10, background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden', display: 'flex',
        }}>
          {paidAmt > 0 && (
            <div style={{ width: `${Math.round((paidAmt / BUDGET) * 100)}%`, background: '#4338CA', borderRadius: 3 }} />
          )}
          {billedAmt > 0 && (
            <div style={{ width: `${Math.round((billedAmt / BUDGET) * 100)}%`, background: '#7C3AED' }} />
          )}
          {pendingAmt > 0 && (
            <div style={{ width: `${Math.round((pendingAmt / BUDGET) * 100)}%`, background: '#D97706', borderRadius: 3 }} />
          )}
        </div>

        {/* Legend */}
        {totalSpent > 0 && (
          <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Paid',    amt: paidAmt,    dot: '#818CF8' },
              { label: 'Billed',  amt: billedAmt,  dot: '#A78BFA' },
              { label: 'Pending', amt: pendingAmt, dot: '#FCD34D' },
            ].filter(l => l.amt > 0).map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.dot }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>
                  {l.label} {formatINRCompact(l.amt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI mini-strip */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 16px 4px' }}>
        {[
          { label: 'Expenses',    value: String(expenses.length) },
          { label: 'AI rate',     value: `${aiRate}%` },
          { label: 'Outstanding', value: formatINRCompact(billedAmt + pendingAmt) },
        ].map(k => (
          <div key={k.label} style={{
            flex: 1, background: color.white, border: `1px solid ${color.border}`,
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{ fontSize: 9, color: color.muted, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontFamily: font.display, fontSize: 17, fontWeight: 700, color: color.ink, marginTop: 2 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Receipt Queue Status */}
      {(pending > 0 || readyCount > 0 || failedCount > 0) && (
        <div style={{ margin: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            fontSize: 9, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase' as const, color: color.muted,
          }}>
            Receipt Queue
          </div>

          {/* Processing chip */}
          {pending > 0 && (
            <div style={{
              background: color.accentLight, border: `1px solid ${color.accent}30`,
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${color.accent}`, borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite', flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: color.accent }}>
                  {pending} receipt{pending > 1 ? 's' : ''} extracting…
                </div>
                <div style={{ fontSize: 10, color: color.muted, marginTop: 1 }}>
                  AI is reading your bills in the background
                </div>
              </div>
            </div>
          )}

          {/* Ready to review chips */}
          {doneItems.map(item => (
            <button
              key={item.id}
              onClick={() => onReviewQueueItem?.(item)}
              style={{
                background: color.successLight, border: `1px solid #A7F3D0`,
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, cursor: onReviewQueueItem ? 'pointer' : 'default',
                fontFamily: font.body, width: '100%', textAlign: 'left' as const,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>
                  {item.extracted?.vendor ? `${item.extracted.vendor} — ready to confirm` : 'Receipt ready to confirm'}
                </div>
                <div style={{ fontSize: 10, color: '#065F46', opacity: 0.7, marginTop: 1 }}>
                  {item.extracted?.amount ? `₹${Math.round(item.extracted.amount).toLocaleString('en-IN')}` : ''}{' '}
                  {item.extracted?.date ?? ''}
                </div>
              </div>
              <span style={{ fontSize: 13, color: '#065F46', fontWeight: 700 }}>→</span>
            </button>
          ))}

          {/* Failed chips */}
          {failedItems.map(item => (
            <button
              key={item.id}
              onClick={() => onReviewQueueItem?.(item)}
              style={{
                background: '#FEF2F2', border: `1px solid #FECACA`,
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, cursor: onReviewQueueItem ? 'pointer' : 'default',
                fontFamily: font.body, width: '100%', textAlign: 'left' as const,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>
                  Extraction failed — enter details manually
                </div>
                <div style={{ fontSize: 10, color: '#991B1B', opacity: 0.7, marginTop: 1 }}>
                  Receipt is saved. Tap to fill in manually.
                </div>
              </div>
              <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 700 }}>→</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent expenses */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: color.muted, marginBottom: 4,
        }}>
          Recent Expenses
        </div>

        {isLoading && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>
            Loading…
          </div>
        )}
        {!isLoading && recent.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>
            No expenses logged this month yet.
          </div>
        )}
        {recent.map((e, i) => (
          <ExpenseRow key={e.id} expense={e} showBorder={i < recent.length - 1} />
        ))}
      </div>
    </div>
  )
}
