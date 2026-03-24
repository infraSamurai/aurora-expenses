import type { Expense } from '../lib/types'
import { formatINR, formatDate } from '../lib/format'
import { Badge } from './Badge'
import { color, font } from '../tokens'

const CAT_ICON: Record<string, string> = {
  'Staff Salaries':           '👥',
  'Utilities':                '⚡',
  'Maintenance & Repairs':    '🔧',
  'Stationery & Supplies':    '📦',
  'Transport':                '🚌',
  'Events & Activities':      '🎉',
  'Printing & Photocopying':  '🖨️',
  'Medical / First Aid':      '🏥',
  'Admin & Other':            '📋',
  'Construction':             '🏗️',
  'Lab & Science Equipment':  '🔬',
  'IT & Technology':          '💻',
  'Library & Books':          '📚',
  'Furniture & Fixtures':     '🪑',
  'Software & Subscriptions': '🔐',
  'Compliance & Legal':       '⚖️',
}

const CAT_BG: Record<string, string> = {
  operational: color.accentLight,
  capital:     color.successLight,
  recurring:   color.warningLight,
}

interface Props {
  expense: Expense
  showBorder?: boolean
}

export function ExpenseRow({ expense, showBorder = true }: Props) {
  const catName = expense.category?.name ?? ''
  const catType = expense.category?.type ?? 'operational'
  const icon = CAT_ICON[catName] ?? '📄'
  const bg   = CAT_BG[catType] ?? color.accentLight

  const methodLabel: Record<string, string> = {
    cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank',
    cheque: 'Cheque', other: 'Other',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0',
      borderBottom: showBorder ? `1px solid ${color.border}` : 'none',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: font.body, fontSize: 12, fontWeight: 500, color: color.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {expense.vendor || expense.description || catName || 'Expense'}
        </div>
        <div style={{ fontFamily: font.body, fontSize: 9, color: color.muted, marginTop: 2 }}>
          {catName || 'Uncategorised'}
          {expense.paymentMethod && ` · ${methodLabel[expense.paymentMethod]}`}
          {expense.aiExtracted && ' · AI'}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 500, color: color.ink }}>
          {formatINR(expense.amount)}
        </div>
        <div style={{ fontFamily: font.body, fontSize: 9, color: color.muted, marginTop: 2 }}>
          {formatDate(expense.date)}
        </div>
      </div>

      {expense.aiExtracted && (
        <Badge variant="ai" />
      )}
    </div>
  )
}
