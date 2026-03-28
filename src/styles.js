export const C = {
  bg: '#0a0a0f',
  surface: '#111118',
  card: '#1a1a24',
  border: '#2a2a3a',
  accent: '#22c55e',
  accent2: '#a855f7',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  text: '#f0f0f0',
  muted: '#888899',
  cardHover: '#1f1f2e',
};

export const fonts = {
  body: "'Sora', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const card = {
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: '12px',
  padding: '20px',
};

export const cardLg = {
  ...card,
  padding: '24px',
};

export const flex = {
  display: 'flex',
  alignItems: 'center',
};

export const flexBetween = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const flexCol = {
  display: 'flex',
  flexDirection: 'column',
};

export const btn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  fontFamily: fonts.body,
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

export const btnPrimary = {
  ...btn,
  backgroundColor: C.accent,
  color: '#000',
};

export const btnSecondary = {
  ...btn,
  backgroundColor: C.surface,
  color: C.text,
  border: `1px solid ${C.border}`,
};

export const btnDanger = {
  ...btn,
  backgroundColor: C.danger,
  color: '#fff',
};

export const btnGhost = {
  ...btn,
  backgroundColor: 'transparent',
  color: C.muted,
  border: `1px solid ${C.border}`,
};

export const input = {
  backgroundColor: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: '8px',
  padding: '10px 14px',
  color: C.text,
  fontSize: '14px',
  fontFamily: fonts.body,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export const label = {
  fontSize: '12px',
  fontWeight: '600',
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: '6px',
};

export const tag = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: '20px',
  fontSize: '11px',
  fontWeight: '600',
};

export const scrollbar = {
  scrollbarWidth: 'thin',
  scrollbarColor: `${C.border} transparent`,
};
