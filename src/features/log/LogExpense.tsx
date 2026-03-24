import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Camera, Image, CheckCircle2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCreateExpense } from '../../hooks/useExpenses'
import { useCategories } from '../../hooks/useCategories'
import { useVendors } from '../../hooks/useVendors'
import { todayISO, formatINR } from '../../lib/format'
import { color, font } from '../../tokens'
import type { ExtractedExpense, CreateExpenseInput, PaymentStatus, ExpenseCategory, LineItem } from '../../lib/types'

// ── State machine ──────────────────────────────────────────────────────────────
type State =
  | { phase: 'capture' }
  | { phase: 'processing' }
  | { phase: 'confirm'; extracted: ExtractedExpense; receiptUrl: string }
  | { phase: 'done'; expense: { amount: number; vendor?: string; date: string } }
  | { phase: 'error'; message: string }

interface Props {
  onBack: () => void
}

// ── Capture Screen ─────────────────────────────────────────────────────────────
function CaptureScreen({
  onCapture,
  onManual,
}: {
  onCapture: (file: File) => void
  onManual: () => void
}) {
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCapture(file)
  }

  return (
    <div style={{ background: '#0F0E0B', minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: font.body }}>
      {/* Viewfinder */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 16px' }}>
        <div style={{
          flex: 1, borderRadius: 12,
          background: '#1A1914', border: '1.5px dashed rgba(255,255,255,0.12)',
          position: 'relative', overflow: 'hidden', minHeight: 240,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Corner brackets */}
          {[
            { top: 10, left: 10, borderTop: '2px solid', borderLeft: '2px solid' },
            { top: 10, right: 10, borderTop: '2px solid', borderRight: '2px solid' },
            { bottom: 10, left: 10, borderBottom: '2px solid', borderLeft: '2px solid' },
            { bottom: 10, right: 10, borderBottom: '2px solid', borderRight: '2px solid' },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', width: 20, height: 20,
              borderColor: color.accent, ...s,
            }} />
          ))}
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em', textAlign: 'center' }}>
            Point at receipt or bill
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>
            RECEIPT CAPTURE
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => cameraRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: color.accent, border: 'none', borderRadius: 10,
            padding: '13px', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: font.body,
          }}
        >
          <Camera size={16} />
          Open Camera
        </button>

        <button
          onClick={() => galleryRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
            padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 12,
            cursor: 'pointer', fontFamily: font.body,
          }}
        >
          <Image size={14} />
          Choose from Gallery
        </button>

        <button
          onClick={onManual}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 11,
            cursor: 'pointer', fontFamily: font.body, padding: '8px',
          }}
        >
          Enter manually without receipt
        </button>

        {/* AI info */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '12px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle2 size={16} color="rgba(255,255,255,0.3)" />
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.45, margin: 0 }}>
            AI extracts vendor, amount, and date automatically
          </p>
        </div>
      </div>

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*"                       onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

// ── Category Picker ─────────────────────────────────────────────────────────────
function CategoryPicker({
  categories,
  value,
  aiSuggested,
  onChange,
}: {
  categories: ExpenseCategory[]
  value: string
  aiSuggested: string
  onChange: (id: string) => void
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 9, fontWeight: 600, letterSpacing: '0.09em',
        textTransform: 'uppercase', color: color.muted, marginBottom: 8,
      }}>
        Category
        {aiSuggested && (
          <span style={{
            marginLeft: 8, background: color.success, color: 'white',
            fontSize: 7, padding: '1px 5px', borderRadius: 3, fontWeight: 700,
            letterSpacing: '0.1em',
          }}>AI PICK</span>
        )}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      }}>
        {categories.map(c => {
          const selected  = value === c.id
          const suggested = aiSuggested === c.id
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 6px', borderRadius: 10, cursor: 'pointer', gap: 4,
                border: `2px solid ${selected ? c.color : suggested ? `${c.color}60` : color.border}`,
                background: selected ? `${c.color}15` : suggested ? `${c.color}08` : color.white,
                position: 'relative', fontFamily: font.body,
              }}
            >
              {suggested && !selected && (
                <div style={{
                  position: 'absolute', top: -5, right: -5,
                  width: 10, height: 10, borderRadius: '50%',
                  background: color.success, border: `2px solid ${color.white}`,
                }} />
              )}
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <span style={{
                fontSize: 9, fontWeight: selected ? 600 : 400,
                color: selected ? c.color : color.muted, textAlign: 'center', lineHeight: 1.2,
              }}>
                {c.name}
              </span>
            </button>
          )
        })}
        {/* None option */}
        <button
          onClick={() => onChange('')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 6px', borderRadius: 10, cursor: 'pointer', gap: 4,
            border: `2px solid ${!value ? color.ink : color.border}`,
            background: !value ? `${color.ink}08` : color.white, fontFamily: font.body,
          }}
        >
          <span style={{ fontSize: 22 }}>—</span>
          <span style={{ fontSize: 9, color: !value ? color.ink : color.muted }}>Other</span>
        </button>
      </div>
    </div>
  )
}

// ── Confirm Screen ─────────────────────────────────────────────────────────────
function ConfirmScreen({
  extracted,
  receiptUrl,
  onSave,
  onCancel,
  saving,
}: {
  extracted: ExtractedExpense
  receiptUrl: string
  onSave: (input: CreateExpenseInput) => void
  onCancel: () => void
  saving: boolean
}) {
  const { data: categories = [] } = useCategories()
  const { data: vendors    = [] } = useVendors()

  const guessedCat = categories.find(
    c => c.name.toLowerCase() === (extracted.suggestedCategoryName ?? '').toLowerCase()
  )

  const [items, setItems] = useState<LineItem[]>(extracted.lineItems ?? [])

  const initialAmount = extracted.lineItems?.length
    ? String(extracted.lineItems.reduce((s, it) => s + it.amount, 0))
    : String(extracted.amount ?? '')
  const [amount,        setAmount]    = useState(initialAmount)
  const [vendor,        setVendor]    = useState(extracted.vendor ?? '')
  const [date,          setDate]      = useState(extracted.date ?? todayISO())
  const [categoryId,    setCategoryId]= useState(guessedCat?.id ?? '')
  const [paymentMethod, setPayMethod] = useState(extracted.paymentMethod ?? 'cash')
  const [paymentStatus, setPayStatus] = useState<PaymentStatus>('paid')
  const [notes,         setNotes]     = useState('')

  useEffect(() => {
    if (items.length > 0) {
      setAmount(String(items.reduce((s, it) => s + it.amount, 0)))
    }
  }, [items])

  const handleSave = () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return
    if (!date) return   // guard against empty date
    onSave({
      amount:        parsed,
      vendor:        vendor.trim() || undefined,
      date,
      categoryId:    categoryId || undefined,
      paymentMethod: paymentMethod as CreateExpenseInput['paymentMethod'],
      paymentStatus,
      receiptUrl:    receiptUrl || undefined,
      aiExtracted:   !!receiptUrl,
      notes:         notes.trim() || undefined,
    })
  }

  const field: React.CSSProperties = {
    background: color.white, border: `1px solid ${color.border}`,
    borderRadius: 8, padding: '10px 12px', marginBottom: 8,
  }
  const label: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, letterSpacing: '0.09em',
    textTransform: 'uppercase', color: color.muted, marginBottom: 3,
    display: 'block',
  }
  const input: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: color.ink,
    background: 'none', border: 'none', outline: 'none',
    width: '100%', fontFamily: font.body, display: 'block',
  }

  const vendorListId = 'vendor-suggestions'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: font.body }}>
      {/* AI banner */}
      <div style={{
        background: color.successLight, padding: '10px 16px', marginTop: 40,
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid #A7F3D0',
      }}>
        <span style={{
          background: color.success, color: 'white',
          fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
          padding: '2px 6px', borderRadius: 4,
        }}>AI</span>
        <span style={{ fontSize: 11, color: '#065F46' }}>
          {receiptUrl ? 'Details extracted — confirm before saving' : 'Manual entry — fill in details'}
        </span>
      </div>

      {/* Vendor suggestions datalist */}
      <datalist id={vendorListId}>
        {vendors.map(v => <option key={v.vendor} value={v.vendor} />)}
      </datalist>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {receiptUrl && (
          <div style={{ height: 72, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
            <img src={receiptUrl} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Amount */}
        <div style={field}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <label style={{ ...label, marginBottom: 0 }}>Amount (₹)</label>
            {items.length > 0 && (
              <span style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                background: color.accentLight, color: color.accent,
                padding: '1px 5px', borderRadius: 3,
              }}>AUTO</span>
            )}
          </div>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
            readOnly={items.length > 0}
            style={{
              ...input, fontFamily: font.display, fontSize: 24, color: color.accent, fontWeight: 700,
              ...(items.length > 0 ? { opacity: 0.75, cursor: 'default' } : {}),
            }}
          />
        </div>

        {/* Line items breakdown — editable */}
        <div style={{
          background: color.parchment, border: `1px solid ${color.border}`,
          borderRadius: 8, marginBottom: 8, overflow: 'hidden',
        }}>
          <div style={{ padding: '7px 12px', borderBottom: `1px solid ${color.border}` }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: color.muted }}>
              Breakdown
            </span>
          </div>

          {items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px 6px 12px',
              borderBottom: `1px solid ${color.border}`,
            }}>
              <input
                value={item.description}
                onChange={e => {
                  const desc = e.target.value
                  setItems(prev => prev.map((it, idx) => idx === i ? { ...it, description: desc } : it))
                }}
                placeholder="Item description"
                style={{
                  ...input, flex: 1,
                  background: 'none', border: 'none', outline: 'none',
                  fontSize: 12, padding: '2px 0',
                }}
              />
              <input
                type="number"
                value={item.amount === 0 ? '' : item.amount}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0
                  setItems(prev => prev.map((it, idx) => idx === i ? { ...it, amount: val } : it))
                }}
                placeholder="0"
                inputMode="decimal"
                style={{
                  ...input, width: 70, textAlign: 'right' as const,
                  fontFamily: font.mono, fontWeight: 600, fontSize: 12,
                  background: 'none', border: 'none', outline: 'none',
                  padding: '2px 0', flexShrink: 0,
                }}
              />
              <button
                onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: color.faint, fontSize: 14, fontWeight: 600,
                  padding: '2px 4px', lineHeight: 1, flexShrink: 0,
                  fontFamily: font.body,
                }}
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add item row */}
          <div style={{ padding: '6px 12px', borderBottom: items.length > 0 ? `1px solid ${color.border}` : 'none' }}>
            <button
              onClick={() => setItems(prev => [...prev, { description: '', amount: 0 }])}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: color.muted, fontSize: 11, fontFamily: font.body,
                padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>+</span> Add item
            </button>
          </div>

          {/* Total row */}
          {items.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 12px', background: color.white,
              borderTop: `1px solid ${color.border}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: color.ink }}>Total</span>
              <span style={{ fontSize: 13, fontFamily: font.mono, fontWeight: 700, color: color.accent }}>
                {formatINR(items.reduce((s, it) => s + it.amount, 0))}
              </span>
            </div>
          )}
        </div>

        {/* Vendor — native datalist autocomplete from existing vendors */}
        <div style={field}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ ...label, marginBottom: 0 }}>Vendor</label>
            {vendor && vendors.some(v => v.vendor === vendor) && (
              <span style={{
                fontSize: 8, color: color.success, fontWeight: 600,
                background: color.successLight, padding: '1px 5px', borderRadius: 3,
              }}>
                KNOWN
              </span>
            )}
          </div>
          <input
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            list={vendorListId}
            style={{ ...input, marginTop: 4 }}
            placeholder="Type or pick from existing…"
          />
        </div>

        {/* Date */}
        <div style={field}>
          <label style={label}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} />
        </div>

        {/* Category — visual tile picker */}
        <div style={{ background: color.white, border: `1px solid ${color.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
          <CategoryPicker
            categories={categories}
            value={categoryId}
            aiSuggested={guessedCat?.id ?? ''}
            onChange={setCategoryId}
          /></div>

        {/* Payment method */}
        <div style={field}>
          <label style={label}>Payment Method</label>
          <select value={paymentMethod} onChange={e => setPayMethod(e.target.value as import('../../lib/types').PaymentMethod)} style={input}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Payment status pill selector */}
        <div style={{ marginBottom: 8 }}>
          <label style={label}>Payment Status</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { value: 'paid'    as const, label: 'Paid',    active: '#ECFDF5', border: color.success,  text: '#065F46' },
              { value: 'billed'  as const, label: 'Billed',  active: '#EDE9FE', border: '#7C3AED',       text: '#5B21B6' },
              { value: 'pending' as const, label: 'Pending', active: color.warningLight, border: color.warning, text: '#92400E' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setPayStatus(opt.value)}
                style={{
                  flex: 1, padding: '7px 0',
                  border: `1.5px solid ${paymentStatus === opt.value ? opt.border : color.border}`,
                  borderRadius: 8,
                  background: paymentStatus === opt.value ? opt.active : color.white,
                  color: paymentStatus === opt.value ? opt.text : color.muted,
                  fontSize: 11, fontWeight: paymentStatus === opt.value ? 700 : 500,
                  fontFamily: font.body, cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Add a note… (optional)" rows={2}
          style={{
            width: '100%', padding: '10px 12px', boxSizing: 'border-box',
            background: color.parchment, border: `1px dashed ${color.border}`,
            borderRadius: 8, resize: 'none',
            fontSize: 11, color: color.muted, fontFamily: font.body, outline: 'none',
          }}
        />
      </div>

      <div style={{ padding: '10px 16px 24px', display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '11px', background: color.white,
          border: `1px solid ${color.border}`, borderRadius: 9,
          fontSize: 12, fontWeight: 500, color: color.muted,
          fontFamily: font.body, cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 2, padding: '11px', background: color.accent, border: 'none', borderRadius: 9,
          fontSize: 13, fontWeight: 700, color: 'white',
          fontFamily: font.body, cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving…' : 'Save Expense'}
        </button>
      </div>
    </div>
  )
}

// ── Success Screen ─────────────────────────────────────────────────────────────
function SuccessScreen({
  expense,
  onBack,
}: {
  expense: { amount: number; vendor?: string; date: string }
  onBack: () => void
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '80px 24px 24px', gap: 18, fontFamily: font.body,
    }}>
      {/* Success ring */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: `2.5px solid ${color.success}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: `0 0 0 8px rgba(5,150,105,0.1)`,
      }}>
        <Check size={32} color={color.success} strokeWidth={2.5} />
      </div>

      <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 600, color: color.ink }}>
        Expense Logged
      </div>
      <div style={{ fontSize: 12, color: color.muted, textAlign: 'center' }}>
        Receipt saved · AI extracted
      </div>

      {/* Summary card */}
      <div style={{
        width: '100%', background: color.white,
        border: `1px solid ${color.border}`, borderRadius: 12,
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: font.mono, fontSize: 18, fontWeight: 500, color: color.ink }}>
            {formatINR(expense.amount)}
          </div>
          <div style={{ fontSize: 11, color: color.muted, marginTop: 2 }}>
            {expense.vendor || 'Expense'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: color.muted }}>
            {new Date(expense.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <span style={{
            display: 'inline-flex', marginTop: 4,
            background: color.accentLight, color: color.accent,
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
          }}>
            AI
          </span>
        </div>
      </div>

      <button onClick={onBack} style={{
        width: '100%', padding: '13px', background: color.ink, border: 'none', borderRadius: 10,
        fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)',
        fontFamily: font.body, cursor: 'pointer',
      }}>
        Back to Home
      </button>
    </div>
  )
}


// ── Main LogExpense ────────────────────────────────────────────────────────────
export function LogExpense({ onBack }: Props) {
  const [state, setState] = useState<State>({ phase: 'capture' })
  const createExpense = useCreateExpense()

  const handleCapture = async (file: File) => {
    const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_BYTES) {
      setState({ phase: 'error', message: 'Image must be under 10 MB.' })
      return
    }

    // Android often returns empty file.type — infer from extension
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const EXT_MIME: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
    }
    const contentType = file.type || EXT_MIME[ext] || 'image/jpeg'

    setState({ phase: 'processing' })
    const path = `receipts/${Date.now()}.${ext}`

    try {
      // Upload to Supabase Storage
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, file, { contentType })
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      const receiptUrl = urlData.publicUrl

      // Call edge function with 1 retry — cold starts can cause the first attempt to fail
      let res
      try {
        const invoke = () => supabase.functions.invoke('extract-receipt', { body: { imageUrl: receiptUrl } })
        res = await invoke()
        if (res.error) {
          // Wait 1.5s and retry once (cold start recovery)
          await new Promise(r => setTimeout(r, 1500))
          res = await invoke()
          if (res.error) throw res.error
        }
      } catch (extractErr) {
        await supabase.storage.from('receipts').remove([path]).catch(() => {/* best-effort cleanup */})
        throw extractErr
      }

      setState({ phase: 'confirm', extracted: res.data as ExtractedExpense, receiptUrl })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
    }
  }

  const handleSave = async (input: CreateExpenseInput) => {
    try {
      const expense = await createExpense.mutateAsync(input)
      setState({ phase: 'done', expense: { amount: expense.amount, vendor: expense.vendor, date: expense.date } })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Failed to save expense. Please try again.' })
    }
  }

  const handleManual = () => {
    const emptyExtracted: ExtractedExpense = {
      amount: null, vendor: null, date: todayISO(),
      suggestedCategoryName: null, paymentMethod: null,
      confidence: 'low', rawText: '',
    }
    setState({ phase: 'confirm', extracted: emptyExtracted, receiptUrl: '' })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: color.parchment }}>
      {/* Header bar */}
      {state.phase !== 'done' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '52px 20px 16px',
          background: state.phase === 'capture' || state.phase === 'processing' ? '#0F0E0B' : color.parchment,
          flexShrink: 0,
        }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={20} color={state.phase === 'capture' || state.phase === 'processing' ? 'rgba(255,255,255,0.6)' : color.ink2} />
          </button>
          <span style={{
            fontFamily: font.display, fontSize: 18, fontWeight: 600,
            color: state.phase === 'capture' || state.phase === 'processing' ? 'white' : color.ink,
          }}>
            Add Expense
          </span>
        </div>
      )}

      {/* Phase content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {state.phase === 'capture' && (
          <CaptureScreen onCapture={handleCapture} onManual={handleManual} />
        )}

        {state.phase === 'processing' && (
          <div style={{
            background: '#0F0E0B', height: '100%', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `3px solid ${color.accent}`, borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontFamily: font.body, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Extracting details…
            </p>
          </div>
        )}

        {state.phase === 'confirm' && (
          <ConfirmScreen
            extracted={state.extracted}
            receiptUrl={state.receiptUrl}
            onSave={handleSave}
            onCancel={onBack}
            saving={createExpense.isPending}
          />
        )}

        {state.phase === 'done' && (
          <SuccessScreen expense={state.expense} onBack={onBack} />
        )}

        {state.phase === 'error' && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ color: color.error, fontSize: 13, marginBottom: 16, fontFamily: font.body }}>
              {state.message}
            </p>
            <button
              onClick={handleManual}
              style={{
                background: color.accent, border: 'none', borderRadius: 9,
                padding: '12px 24px', color: 'white', fontSize: 13, fontWeight: 600,
                fontFamily: font.body, cursor: 'pointer',
              }}
            >
              Enter manually instead
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
