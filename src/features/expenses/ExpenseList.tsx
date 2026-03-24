import { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import { useCategories } from '../../hooks/useCategories'
import { useUpdatePaymentStatus } from '../../hooks/useExpenses'
import { ExpenseRow } from '../../components/ExpenseRow'
import { formatINR, currentMonth, monthLabel } from '../../lib/format'
import { color, font } from '../../tokens'
import type { PaymentStatus, ExpenseFilters, CategoryType } from '../../lib/types'

function getPastMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })
}

const STATUS_OPTS: { value: PaymentStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'billed', label: 'Billed' },
  { value: 'pending', label: 'Pending' },
]

const STATUS_COLOR: Record<PaymentStatus, { bg: string; text: string }> = {
  paid:    { bg: '#D1FAE5', text: '#059669' },
  billed:  { bg: '#EEF2FF', text: '#4338CA' },
  pending: { bg: '#FEF3C7', text: '#D97706' },
}

export function ExpenseList({ defaultType }: { defaultType?: CategoryType }) {
  const months = getPastMonths(6)
  const [month, setMonth]         = useState(currentMonth())
  const [catId, setCatId]         = useState('')
  const [status, setStatus]       = useState<PaymentStatus | ''>('')
  const [vendorQ, setVendorQ]     = useState('')

  const filters: ExpenseFilters = {
    month,
    ...(catId  ? { categoryId: catId } : {}),
    ...(status ? { paymentStatus: status } : {}),
    ...(vendorQ.trim() ? { vendor: vendorQ.trim() } : {}),
  }

  const { data: rawExpenses = [], isLoading } = useExpenses(filters)
  const { data: categories = [] }             = useCategories()
  const updateStatus = useUpdatePaymentStatus()

  // Apply category type filter client-side (joined `category.type` not filterable server-side without RPC)
  const expenses = defaultType
    ? rawExpenses.filter(e => e.category?.type === defaultType)
    : rawExpenses

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const pillStyle = (active: boolean, activeColor: string) => ({
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
    border: `1px solid ${active ? activeColor : color.border}`,
    background: active ? activeColor : color.white,
    color: active ? 'white' : color.muted,
    cursor: 'pointer',
    fontFamily: font.body,
  })

  return (
    <div style={{ background: color.parchment, minHeight: '100%', paddingBottom: 80, fontFamily: font.body }}>

      {/* Header */}
      <div style={{ background: color.white, borderBottom: `1px solid ${color.border}`, padding: '16px 16px 12px' }}>
        <div style={{ fontSize: 18, fontFamily: font.display, fontWeight: 700, color: color.ink, marginBottom: 2 }}>
          {defaultType ? defaultType.charAt(0).toUpperCase() + defaultType.slice(1) : 'All'} Expenses
        </div>
        <div style={{ fontSize: 11, color: color.muted }}>
          {expenses.length} entries · {formatINR(total)}
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: color.white, borderBottom: `1px solid ${color.border}`, padding: '12px 16px' }}>
        {/* Month selector */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {months.map(m => (
            <button key={m} onClick={() => setMonth(m)}
              style={pillStyle(month === m, color.ink)}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>

        {/* Category + Status row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <select
            value={catId}
            onChange={e => setCatId(e.target.value)}
            style={{
              flex: 1, fontSize: 11, padding: '6px 10px', border: `1px solid ${color.border}`,
              borderRadius: 8, background: color.white, color: color.ink, fontFamily: font.body,
            }}
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value as PaymentStatus | '')}
            style={{
              flex: 1, fontSize: 11, padding: '6px 10px', border: `1px solid ${color.border}`,
              borderRadius: 8, background: color.white, color: color.ink, fontFamily: font.body,
            }}
          >
            {STATUS_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Vendor search */}
        <input
          type="text"
          placeholder="Search vendor…"
          value={vendorQ}
          onChange={e => setVendorQ(e.target.value)}
          style={{
            width: '100%', marginTop: 8, fontSize: 12, padding: '7px 12px',
            border: `1px solid ${color.border}`, borderRadius: 8, background: color.white,
            color: color.ink, fontFamily: font.body, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px 0' }}>
        {isLoading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>Loading…</div>
        )}
        {!isLoading && expenses.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: color.muted, fontSize: 13 }}>
            No expenses match these filters.
          </div>
        )}
        {expenses.map((e, i) => (
          <div key={e.id}>
            <ExpenseRow expense={e} showBorder={i < expenses.length - 1} />
            {/* Inline status toggle */}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 12, paddingLeft: 44 }}>
              {(['pending', 'billed', 'paid'] as PaymentStatus[]).map(s => {
                const active = e.paymentStatus === s
                const sc = STATUS_COLOR[s]
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (!active) updateStatus.mutate({ id: e.id, status: s })
                    }}
                    style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 20,
                      border: `1px solid ${active ? sc.text : color.border}`,
                      background: active ? sc.bg : 'transparent',
                      color: active ? sc.text : color.muted,
                      cursor: active ? 'default' : 'pointer',
                      fontFamily: font.body, fontWeight: active ? 600 : 400,
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
