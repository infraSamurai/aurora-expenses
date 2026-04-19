import { useState } from 'react'
import { Search, Sparkles, ArrowRight } from 'lucide-react'
import { color, font } from '../../tokens'

const SUGGESTIONS: { category: string; questions: string[] }[] = [
  {
    category: 'Spend & trends',
    questions: [
      'How much did we spend on transport last term?',
      'Compare utilities this year vs last year',
      'Which category grew fastest in Q1?',
      'Cafeteria spend by month',
    ],
  },
  {
    category: 'Vendors',
    questions: [
      'Vendors we paid more than ₹50k this year',
      'Show Ravi Motors trend',
      'Top 10 vendors this quarter',
    ],
  },
  {
    category: 'Cash flow',
    questions: [
      'Show all pending bills older than 30 days',
      'What do we owe this week?',
      'Projected month-end total',
    ],
  },
  {
    category: 'Projects',
    questions: [
      'Library renovation: what\'s left in the budget?',
      'Which projects are over budget?',
    ],
  },
]

export function Ask() {
  const [q, setQ] = useState('')

  return (
    <div style={{ background: color.parchment, minHeight: '100%', paddingBottom: 80, fontFamily: font.body }}>
      {/* Header */}
      <div style={{ padding: '40px 24px 20px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Sparkles size={16} color={color.accent} />
          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: color.muted, fontWeight: 600 }}>
            Ask your ledger
          </span>
        </div>
        <h1 style={{
          fontFamily: font.display, fontSize: 28, fontWeight: 700,
          color: color.ink, letterSpacing: '-0.02em', margin: '0 0 18px',
        }}>
          What do you want to know?
        </h1>

        {/* Query box */}
        <form
          onSubmit={(e) => { e.preventDefault(); /* brain wiring in phase 4 */ }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: color.white, border: `1px solid ${color.border}`,
            borderRadius: 12, padding: '12px 14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <Search size={16} color={color.muted} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. transport spend last term…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontFamily: font.body,
              fontSize: 14, color: color.ink,
            }}
          />
          <button
            type="submit"
            disabled={!q.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', border: 'none', borderRadius: 6,
              background: q.trim() ? color.accent : color.border,
              color: q.trim() ? 'white' : color.muted,
              fontSize: 12, fontWeight: 600, cursor: q.trim() ? 'pointer' : 'default',
              fontFamily: font.body,
            }}
          >
            Ask
            <ArrowRight size={12} />
          </button>
        </form>

        {/* Brain status pill */}
        <div style={{
          marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: color.warningLight, color: color.warning,
          fontSize: 10, fontWeight: 500,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.warning }} />
          Brain coming soon — suggestions preview how it'll work
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ padding: '12px 24px', maxWidth: 820, margin: '0 auto' }}>
        {SUGGESTIONS.map(({ category, questions }) => (
          <div key={category} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: color.muted, marginBottom: 8,
            }}>
              {category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {questions.map((question) => (
                <button
                  key={question}
                  onClick={() => setQ(question)}
                  style={{
                    textAlign: 'left', padding: '10px 14px',
                    background: color.white, border: `1px solid ${color.border}`,
                    borderRadius: 8, cursor: 'pointer',
                    fontFamily: font.body, fontSize: 13, color: color.ink,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <span>{question}</span>
                  <ArrowRight size={12} color={color.muted} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
