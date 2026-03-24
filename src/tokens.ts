// Design tokens — single source of truth
// Matches the mockup design system exactly

export const color = {
  parchment: '#F7F4EF',
  ink:       '#1A1714',
  ink2:      '#3A3330',
  muted:     '#8B8175',
  faint:     '#C4B5AB',
  border:    '#E0DBD4',
  white:     '#FFFFFF',
  accent:    '#4338CA',
  accentLight: '#EEF2FF',
  success:   '#059669',
  successLight: '#D1FAE5',
  warning:   '#D97706',
  warningLight: '#FEF3C7',
  error:     '#DC2626',
  errorLight: '#FFF5F5',
} as const

export const font = {
  display: "'Fraunces', serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
} as const

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const
