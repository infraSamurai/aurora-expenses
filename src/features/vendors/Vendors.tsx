import { useVendors } from '../../hooks/useVendors'
import { useExpenses } from '../../hooks/useExpenses'
import { useUpdatePaymentStatus } from '../../hooks/useExpenses'
import { formatINRCompact, formatINR, currentMonth } from '../../lib/format'
import { color, font } from '../../tokens'
import type { PaymentStatus, Expense } from '../../lib/types'

const STATUS_META: Record<PaymentStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  billed:  { label: 'Billed',  bg: '#EEF2FF', text: '#4338CA', border: '#A5B4FC' },
  paid:    { label: 'Paid',    bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
}

function StatusPill({ status, onToggle }: { status: PaymentStatus; onToggle: (s: PaymentStatus) => void }) {
  const order: PaymentStatus[] = ['pending', 'billed', 'paid']
  const m = STATUS_META[status]
  return (
    <button
      onClick={() => {
        const next = order[(order.indexOf(status) + 1) % order.length]
        onToggle(next)
      }}
      title="Click to advance status"
      style={{
        fontSize: 10, padding: '3px 10px', borderRadius: 20,
        background: m.bg, color: m.text, border: `1px solid ${m.border}`,
        cursor: 'pointer', fontFamily: font.body, fontWeight: 600,
      }}
    >
      {m.label}
    </button>
  )
}

function VendorExpenseItem({ expense }: { expense: Expense }) {
  const updateStatus = useUpdatePaymentStatus()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: `1px solid ${color.border}`,
    }}>
      <div>
        <div style={{ fontSize: 12, color: color.ink, fontWeight: 500 }}>
          {expense.description || expense.vendor || '—'}
        </div>
        <div style={{ fontSize: 10, color: color.muted, marginTop: 1 }}>
          {expense.date}
          {expense.paymentMethod && ` · ${expense.paymentMethod.replace('_', ' ')}`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 600, color: color.ink }}>
          {formatINR(expense.amount)}
        </span>
        <StatusPill
          status={expense.paymentStatus}
          onToggle={s => updateStatus.mutate({ id: expense.id, status: s })}
        />
      </div>
    </div>
  )
}

export function Vendors() {
  const { data: vendors = [], isLoading } = useVendors()
  const { data: allExpenses = [] }        = useExpenses({ month: currentMonth() })

  const outstanding = vendors.reduce((s, v) => s + v.pendingAmount + v.billedAmount, 0)

  return (
    <div style={{ background: color.parchment, minHeight: '100%', paddingBottom: 80, fontFamily: font.body }}>

      {/* Header */}
      <div style={{ background: color.ink, padding: '52px 20px 22px', borderRadius: '0 0 24px 24px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
          Outstanding across all vendors
        </div>
        <div style={{ fontFamily: font.display, fontSize: 32, fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>
          {isLoading ? '—' : formatINRCompact(outstanding)}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          {vendors.length} vendors
        </div>
      </div>

      {/* Vendor cards */}
      <div style={{ padding: '16px 16px 0' }}>
        {isLoading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>Loading…</div>
        )}
        {!isLoading && vendors.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>
            No vendors found. Log an expense to get started.
          </div>
        )}
        {vendors.map(v => {
          const vendorLower    = v.vendor.toLowerCase()
          const vendorExpenses = allExpenses.filter(e => (e.vendor ?? '').toLowerCase() === vendorLower)
          return (
            <div
              key={v.vendor}
              style={{
                background: color.white, border: `1px solid ${color.border}`,
                borderRadius: 12, marginBottom: 12, overflow: 'hidden',
              }}
            >
              {/* Vendor header */}
              <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${color.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: color.ink }}>{v.vendor}</div>
                    <div style={{ fontSize: 10, color: color.muted, marginTop: 2 }}>
                      {v.totalCount} transactions · last {v.lastTransaction}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 700, color: color.ink }}>
                      {formatINRCompact(v.totalAmount)}
                    </div>
                    <div style={{ fontSize: 9, color: color.muted }}>total</div>
                  </div>
                </div>

                {/* Status breakdown strip */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {([
                    { ...STATUS_META.pending, amt: v.pendingAmount, cnt: v.pendingCount },
                    { ...STATUS_META.billed,  amt: v.billedAmount,  cnt: v.billedCount  },
                    { ...STATUS_META.paid,    amt: v.paidAmount,    cnt: v.totalCount - v.pendingCount - v.billedCount },
                  ]).filter(s => s.amt > 0).map(s => (
                    <div key={s.label} style={{
                      flex: 1, padding: '6px 8px', borderRadius: 8,
                      background: s.bg, border: `1px solid ${s.border}`,
                    }}>
                      <div style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 700, color: s.text }}>
                        {formatINRCompact(s.amt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual expenses for this vendor (this month) */}
              {vendorExpenses.length > 0 && (
                <div style={{ padding: '0 16px' }}>
                  {vendorExpenses.map(e => (
                    <VendorExpenseItem key={e.id} expense={e} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
