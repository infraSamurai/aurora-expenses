// All INR and date formatting — Indian locale, DM Mono font family

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export function formatINR(amount: number): string {
  return INR.format(amount)
}

export function formatINRCompact(amount: number): string {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`
  if (amount >= 1_000)   return `₹${(amount / 1_000).toFixed(0)}K`
  return `₹${amount}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7) // 'YYYY-MM'
}

export function monthLabel(yyyymm: string): string {
  return new Date(`${yyyymm}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
