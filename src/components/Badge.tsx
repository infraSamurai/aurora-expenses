import { color, font } from '../tokens'

type Variant = 'ai' | 'verified' | 'pending-status' | 'paid' | 'billed' | 'pending-pay'

const VARIANTS: Record<Variant, { bg: string; text: string; label: string }> = {
  'ai':           { bg: color.accentLight,   text: color.accent,  label: 'AI'       },
  'verified':     { bg: color.successLight,  text: '#065F46',     label: 'Verified' },
  'pending-status':{ bg: color.warningLight, text: '#92400E',     label: 'Pending'  },
  'paid':         { bg: color.successLight,  text: '#065F46',     label: 'Paid'     },
  'billed':       { bg: '#EDE9FE',           text: '#5B21B6',     label: 'Billed'   },
  'pending-pay':  { bg: color.warningLight,  text: '#92400E',     label: 'Pending'  },
}

interface Props {
  variant: Variant
  className?: string
}

export function Badge({ variant }: Props) {
  const { bg, text, label } = VARIANTS[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 100,
      background: bg, color: text,
      fontFamily: font.body, fontSize: 9, fontWeight: 600, letterSpacing: '0.05em',
    }}>
      {label}
    </span>
  )
}
