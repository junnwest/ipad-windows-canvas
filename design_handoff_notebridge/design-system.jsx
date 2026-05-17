// NoteBridge — Design system primitives
// Icons (stroke-based, 20px), paper, ink samples, atoms

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'pen',         label: 'Pen' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'eraser',      label: 'Eraser' },
  { id: 'lasso',       label: 'Lasso' },
  { id: 'text',        label: 'Text' },
  { id: 'shape',       label: 'Shape' },
  { id: 'hand',        label: 'Hand' },
];

const COLORS = [
  '#1c1814', // ink
  '#b35040', // red
  '#486488', // blue
  '#5c7058', // sage
  '#b89868', // tan
  '#d6b25a', // yellow
  '#8c6aa6', // plum
  '#cc7a5a', // terracotta
];

const SIZES = [1.5, 2.5, 4, 6, 9];

const COVER_COLORS = ['#5c7058', '#486488', '#b35040', '#b89868', '#3d3936', '#8c6aa6', '#a86a4a', '#41524a'];

// ─────────────────────────────────────────────────────────────
// Icons — uniform 20px stroke set
// ─────────────────────────────────────────────────────────────
const I = {
  pen: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M14.5 2.5l3 3-10 10L4 16l.5-3.5 10-10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M12.6 4.4l3 3" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  highlighter: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M4.6 14.4l-1.5 3h4l1.4-3M4.6 14.4l7.4-7.4 3 3-7.4 7.4H4.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M12 7l2.4-2.4 3 3L15 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  eraser: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M11 3.5l5.5 5.5-7 7H5L3.5 14l7.5-10.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M7.5 7l5.5 5.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  lasso: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M3.5 8c0-2.5 3-4.5 6.5-4.5s6.5 2 6.5 4.5c0 2-2 3.7-4.5 4.3" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2"/>
      <path d="M9 13.5c0 2 .5 3.5-1.5 3.5s-2-2-1-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  text: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M4 4h12M10 4v12M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  shape: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <rect x="3" y="3" width="9" height="9" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="13" cy="13" r="4" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  hand: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M7 10V4.5a1.2 1.2 0 012.4 0V9M9.4 9V3.5a1.2 1.2 0 012.4 0V9M11.8 9V4.5a1.2 1.2 0 012.4 0v6.5c0 3.3-2 5.5-5 5.5-2.5 0-3.6-1.5-4.6-3l-1.5-2.3c-.7-1 .3-2.2 1.4-1.5l1.7 1V7a1.2 1.2 0 012.4 0v3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  undo: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M3 7h8a4 4 0 010 8H6M3 7l3-3M3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  redo: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M15 7H7a4 4 0 000 8h5M15 7l-3-3M15 7l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (p={}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  chevron: (dir='down', p={}) => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" {...p}>
      <path d={
        dir==='down'  ? 'M2.5 4.5l3 3 3-3'
      : dir==='left'  ? 'M6.5 2.5l-3 3 3 3'
      : dir==='right' ? 'M4.5 2.5l3 3-3 3'
      :                 'M2.5 6.5l3-3 3 3'
      } stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrow: (dir='left', p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d={dir==='left' ? 'M11 4l-5 5 5 5M6 9h8' : 'M7 4l5 5-5 5M5 9h8'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pages: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <rect x="2.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="10.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="2.5" y="10.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="10.5" y="10.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  share: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M9 2v10M9 2L6 5M9 2l3 3M3.5 9v5.5h11V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ipad: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <rect x="3.5" y="1.5" width="11" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="9" cy="14.2" r=".7" fill="currentColor"/>
    </svg>
  ),
  search: (p={}) => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" {...p}>
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9.8 9.8L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  star: (p={}) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 1.5l1.7 3.5 3.8.5-2.7 2.7.6 3.8L7 10.2 3.6 12l.6-3.8L1.5 5.5l3.8-.5L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  ellipsis: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <circle cx="4" cy="9" r="1.4" fill="currentColor"/>
      <circle cx="9" cy="9" r="1.4" fill="currentColor"/>
      <circle cx="14" cy="9" r="1.4" fill="currentColor"/>
    </svg>
  ),
  settings: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 1.5v2M9 14.5v2M2.6 5.5l1.7 1M13.7 11.5l1.7 1M2.6 12.5l1.7-1M13.7 6.5l1.7-1M1.5 9h2M14.5 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  check: (p={}) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  close: (p={}) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  trash: (p={}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M3 4h10M6 4V2.5h4V4M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9M7 7v5M9 7v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  duplicate: (p={}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M11 5V3.5a1 1 0 00-1-1H3.5a1 1 0 00-1 1V10a1 1 0 001 1H5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  export: (p={}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M3 11v2.5h10V11M8 2v8M8 2L5 5M8 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  copy: (p={}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M11 5V3.5a1 1 0 00-1-1H3.5a1 1 0 00-1 1V10a1 1 0 001 1H5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  link: (p={}) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M7 9.5a3 3 0 004.2 0l2-2a3 3 0 00-4.2-4.2l-1 1M9 6.5a3 3 0 00-4.2 0l-2 2a3 3 0 004.2 4.2l1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  wifi: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M2 7.5c4-3.5 10-3.5 14 0M4.5 10c2.5-2.2 6.5-2.2 9 0M7 12.5c1.2-1 2.8-1 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="14.5" r="0.9" fill="currentColor"/>
    </svg>
  ),
  bell: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M4 13h10l-1.2-1.5a3 3 0 01-.6-1.8V7.5a3.2 3.2 0 00-6.4 0v2.2a3 3 0 01-.6 1.8L4 13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M7.5 15a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  lock: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <rect x="3.5" y="8" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  cloud: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M5 13h8.5a2.5 2.5 0 000-5 3.5 3.5 0 00-6.7-1A3 3 0 005 13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  palette: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M9 2a7 7 0 100 14c1 0 1.5-.5 1.5-1.5S10 13 10 12s.7-1.5 1.5-1.5h2a2.5 2.5 0 002.5-2.5A7 7 0 009 2z" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="5" cy="8" r="1" fill="currentColor"/>
      <circle cx="8" cy="5" r="1" fill="currentColor"/>
      <circle cx="12" cy="6" r="1" fill="currentColor"/>
    </svg>
  ),
  info: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 8v4M9 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  pencil: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M3 13.5L3 15h1.5L13 6.5l-1.5-1.5L3 13.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M11.5 5l1.5 1.5M2 16h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  list: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <path d="M5 5h10M5 9h10M5 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="2.5" cy="5" r="0.8" fill="currentColor"/>
      <circle cx="2.5" cy="9" r="0.8" fill="currentColor"/>
      <circle cx="2.5" cy="13" r="0.8" fill="currentColor"/>
    </svg>
  ),
  grid: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="10" y="2.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="2.5" y="10" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="10" y="10" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  bookmark: (p={}) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M3.5 2h7v10l-3.5-2.5L3.5 12V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// iOS landscape status bar
// ─────────────────────────────────────────────────────────────
function StatusTime({ time = '9:41', dark = false }) {
  const c = dark ? '#fff' : 'rgba(28,24,20,0.88)';
  return (
    <span style={{
      fontSize: 13, fontWeight: 600, color: c, letterSpacing: -0.1,
      fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-ui)',
    }}>{time}</span>
  );
}

function StatusTrailing({ dark = false, wifi = true, battery = 0.78 }) {
  const c = dark ? '#fff' : 'rgba(28,24,20,0.88)';
  const cMute = dark ? 'rgba(255,255,255,0.4)' : 'rgba(28,24,20,0.4)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="17" height="11" viewBox="0 0 17 11">
        <rect x="0" y="7" width="3" height="4" rx="0.6" fill={c}/>
        <rect x="4.5" y="5" width="3" height="6" rx="0.6" fill={c}/>
        <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill={c}/>
        <rect x="13.5" y="0" width="3" height="11" rx="0.6" fill={c}/>
      </svg>
      {wifi && (
        <svg width="16" height="11" viewBox="0 0 16 11">
          <path d="M8 3C10 3 11.8 3.8 13.2 5L14.2 4C12.6 2.4 10.4 1.4 8 1.4C5.6 1.4 3.4 2.4 1.8 4L2.8 5C4.2 3.8 6 3 8 3Z" fill={c}/>
          <path d="M8 6.2C9.2 6.2 10.3 6.6 11.1 7.4L12.1 6.4C10.95 5.3 9.55 4.6 8 4.6C6.45 4.6 5.05 5.3 3.9 6.4L4.9 7.4C5.7 6.6 6.8 6.2 8 6.2Z" fill={c}/>
          <circle cx="8" cy="9.5" r="1.4" fill={c}/>
        </svg>
      )}
      <svg width="26" height="12" viewBox="0 0 26 12">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={c} strokeOpacity="0.4" fill="none"/>
        <rect x="2" y="2" width={19 * battery} height="8" rx="1.6" fill={c}/>
        <path d="M24 4v4c.7-.25 1.3-1 1.3-2s-.6-1.75-1.3-2Z" fill={c} fillOpacity="0.4"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status pill — connected to desktop
// ─────────────────────────────────────────────────────────────
function StatusPill({ connected, latency = 12, deviceName = "Kenneth's PC", onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 8px',
      background: connected ? 'rgba(92,112,88,0.10)' : 'rgba(28,24,20,0.05)',
      border: connected ? '0.5px solid rgba(92,112,88,0.28)' : '0.5px solid var(--rule-strong)',
      borderRadius: 999, fontSize: 12, color: connected ? 'var(--sage)' : 'var(--ink-mute)',
      fontVariantNumeric: 'tabular-nums', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: connected ? 'var(--sage)' : 'var(--ink-faint)',
        boxShadow: connected ? '0 0 0 3px rgba(92,112,88,0.15)' : 'none',
      }}/>
      <span style={{ color: 'var(--ink-soft)' }}>{deviceName}</span>
      <span style={{ opacity: 0.55, fontSize: 11 }}>·</span>
      <span>{connected ? `${latency} ms` : 'Offline'}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Tool button
// ─────────────────────────────────────────────────────────────
function ToolBtn({ icon, active, onClick, size = 40, title, color }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, borderRadius: 9, border: 'none',
        background: active ? 'rgba(28,24,20,0.08)' : hover ? 'rgba(28,24,20,0.04)' : 'transparent',
        color: active ? (color || 'var(--ink)') : 'var(--ink-soft)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .12s, transform .12s', position: 'relative',
        transform: active ? 'translateY(0)' : 'translateY(0)',
      }}>
      {icon}
      {active && (
        <span style={{
          position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
          width: 14, height: 2, borderRadius: 1, background: color || 'var(--ink)',
        }}/>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Pen well — pop-out color+size picker
// ─────────────────────────────────────────────────────────────
function PenWell({ color, size, expanded, onToggle, onColor, onSize, position = 'bottom' }) {
  const dropdown = (
    <div className="nb-scale-in" style={{
      position: 'absolute',
      ...(position === 'bottom' ? { top: 'calc(100% + 8px)' } : { bottom: 'calc(100% + 8px)' }),
      left: '50%', transform: 'translateX(-50%)', zIndex: 30, transformOrigin: position === 'bottom' ? 'top center' : 'bottom center',
      background: 'rgba(252,248,240,0.96)', backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: 14, padding: 14, width: 248,
      boxShadow: '0 16px 48px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Color</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 16 }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => onColor(c)} style={{
            width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
            boxShadow: c === color
              ? `0 0 0 2px var(--paper), 0 0 0 3.5px ${c === '#1c1814' ? '#5c7058' : 'var(--ink)'}`
              : 'inset 0 0 0 1px rgba(0,0,0,0.10)',
            transition: 'transform .12s',
          }}/>
        ))}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Size</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
        {SIZES.map(s => (
          <button key={s} onClick={() => onSize(s)} style={{
            flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: s === size ? 'rgba(28,24,20,0.08)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ width: s * 2.4, height: s * 2.4, borderRadius: '50%', background: color, maxWidth: 22, maxHeight: 22 }}/>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px 6px 8px',
        background: expanded ? 'rgba(28,24,20,0.07)' : 'transparent',
        border: 'none', borderRadius: 9, cursor: 'pointer', height: 40,
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: '50%', background: color,
          boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.5), 0 0 0 0.5px rgba(0,0,0,0.18)'
        }}/>
        <span style={{ width: 18, height: size * 1.6, borderRadius: size, background: color, opacity: 0.9, maxHeight: 16 }}/>
        {I.chevron(position === 'bottom' ? 'down' : 'up', { style: { color: 'var(--ink-mute)' } })}
      </button>
      {expanded && dropdown}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Paper page — templates + sample ink
// ─────────────────────────────────────────────────────────────
function PaperPage({ template = 'dotted', width = 580, height = 700, children, accent = 'var(--rule)' }) {
  let pattern = null;
  if (template === 'dotted') {
    pattern = (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <defs><pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#b0a48d"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
      </svg>
    );
  } else if (template === 'ruled') {
    const lines = [];
    for (let y = 56; y < height; y += 32) lines.push(<line key={y} x1="48" x2={width - 40} y1={y} y2={y} stroke="#bcc8d8" strokeOpacity="0.6" strokeWidth="0.7"/>);
    pattern = <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>{lines}<line x1="64" x2="64" y1="0" y2={height} stroke="#d4a8a0" strokeOpacity="0.7" strokeWidth="0.7"/></svg>;
  } else if (template === 'squared') {
    pattern = (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.45 }}>
        <defs><pattern id="grid-sq" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0v22" fill="none" stroke="#c0b39a" strokeWidth="0.6"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid-sq)"/>
      </svg>
    );
  } else if (template === 'cornell') {
    pattern = (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <line x1={width * 0.3} x2={width * 0.3} y1={80} y2={height - 100} stroke="#c0b39a" strokeWidth="0.8"/>
        <line x1={28} x2={width - 28} y1={height - 100} y2={height - 100} stroke="#c0b39a" strokeWidth="0.8"/>
        <line x1={28} x2={width - 28} y1={80} y2={80} stroke="#c0b39a" strokeWidth="0.8"/>
      </svg>
    );
  } else if (template === 'three-col') {
    pattern = (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <line x1={width / 3} x2={width / 3} y1={48} y2={height - 48} stroke="#c0b39a" strokeWidth="0.7"/>
        <line x1={width * 2 / 3} x2={width * 2 / 3} y1={48} y2={height - 48} stroke="#c0b39a" strokeWidth="0.7"/>
      </svg>
    );
  }

  return (
    <div className="paper-grain" style={{
      width, height, background: 'var(--paper)', position: 'relative',
      boxShadow: '0 0.5px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.07), 0 32px 80px rgba(0,0,0,0.05)',
      borderRadius: 1, overflow: 'hidden',
    }}>
      {pattern}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sample ink — handwritten SVG strokes for "lived-in" pages
// ─────────────────────────────────────────────────────────────
function SampleInk({ variant = 'meeting', viewBox = '0 0 580 700' }) {
  if (variant === 'meeting') return (
    <svg width="100%" height="100%" viewBox={viewBox} style={{ position: 'absolute', inset: 0 }}>
      {/* Title */}
      <g fill="none" stroke="#1c1814" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 100 Q66 86, 86 86 T128 96 Q128 108, 110 113 Q92 116, 96 102"/>
        <path d="M128 96 Q140 104, 140 86 Q140 78, 132 90 Q128 100, 136 116"/>
        <path d="M164 84 L164 116 M164 100 L184 100 M184 84 L184 116"/>
        <path d="M205 84 L205 116 M220 84 L220 116 M205 100 L220 100"/>
        <path d="M240 84 Q234 90, 240 98 Q246 103, 240 110 Q234 114, 238 116 L262 116"/>
        <path d="M280 84 L278 116 M291 88 Q299 84, 301 98 Q301 110, 287 110"/>
      </g>
      <path d="M55 134 Q200 130, 320 136" stroke="#b35040" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Date stamp */}
      <text x="430" y="100" fill="#897e6e" fontSize="11" fontFamily="Newsreader, serif" fontStyle="italic">May 14 · Tue</text>

      {/* Bullets */}
      <g fill="none" stroke="#1c1814" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="74" cy="190" r="2.5" fill="#1c1814"/>
        <path d="M92 178 Q96 184, 94 194 M104 176 L104 198 Q108 198, 110 187 Q112 176, 104 180 M122 184 Q117 184, 117 194 Q117 202, 126 198 M136 176 L136 202 M146 178 L142 202 M160 188 Q160 176, 170 180 Q174 188, 166 192 L176 202 M184 176 L184 202 M192 188 Q202 178, 204 194 Q204 205, 192 202"/>
        <path d="M222 180 Q218 192, 228 192 Q236 192, 230 180 M244 176 L244 202 M254 178 L250 202 M270 184 Q264 188, 268 198 Q276 202, 278 188"/>

        <circle cx="74" cy="232" r="2.5" fill="#1c1814"/>
        <path d="M92 220 Q96 226, 96 236 M108 218 L108 242 M116 222 Q124 222, 126 234 Q124 244, 114 242 M142 218 L142 244 M152 226 L146 242 M164 232 Q174 224, 176 238 M190 218 L190 244 Q198 244, 200 232 Q200 220, 194 222"/>

        <circle cx="74" cy="274" r="2.5" fill="#1c1814"/>
        <path d="M92 262 Q96 270, 96 282 M108 260 L108 286 M119 262 L119 286 M130 268 Q124 274, 128 282 Q136 286, 138 276 M152 260 L152 286 M162 266 L158 286 M176 272 Q186 262, 186 278 Q186 290, 174 286"/>

        <circle cx="74" cy="316" r="2.5" fill="#1c1814" opacity="0.5"/>
        <path d="M92 304 Q96 312, 96 322 M108 302 L108 326 M118 308 L113 326" opacity="0.5" stroke="#1c1814"/>
      </g>

      {/* Boxed note */}
      <g fill="none" stroke="#b35040" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="60" y="362" width="220" height="68" rx="3" fill="rgba(179,80,64,0.04)"/>
        <path d="M76 388 Q83 382, 90 386 Q96 390, 103 386 M113 382 L113 396 M122 384 L118 398 M132 388 Q140 384, 142 394 M156 382 L156 398 M166 384 L162 400"/>
        <path d="M76 410 Q82 405, 88 409 L96 409 M106 403 L106 419 M118 405 L114 421 M132 409 Q140 405, 142 415 M156 403 L156 421"/>
      </g>
      <path d="M310 392 L440 392 M432 386 L440 392 L432 398" stroke="#486488" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Side diagram */}
      <g fill="none" stroke="#5c7058" strokeWidth="1.6">
        <circle cx="490" cy="232" r="34"/>
        <circle cx="490" cy="326" r="34"/>
        <path d="M490 266 L490 292 M484 286 L490 292 L496 286"/>
      </g>
      <g fill="#5c7058" stroke="none" fontFamily="Newsreader, serif" fontSize="12" fontStyle="italic">
        <text x="476" y="236">iPad</text>
        <text x="470" y="330">Win·PC</text>
      </g>

      {/* Highlighter */}
      <rect x="58" y="490" width="244" height="14" fill="#d6b25a" opacity="0.4"/>
      <g fill="none" stroke="#1c1814" strokeWidth="1.6" strokeLinecap="round">
        <path d="M70 500 Q74 493, 78 500 M86 491 L86 505 M96 493 L92 507 M108 497 Q116 491, 118 503 M132 491 L132 505 M142 493 L138 507 M156 497 Q148 501, 152 511 M178 491 L178 507 M188 493 L192 505 L196 493 M206 491 L206 507 M216 493 L216 507 M226 497 Q232 491, 236 501 Q236 511, 224 507 M252 491 L252 507 M262 493 L258 507"/>
      </g>

      <text x="60" y="660" fill="#897e6e" fontSize="11" fontFamily="Newsreader, serif" fontStyle="italic">Q3 planning sync · Studio</text>
    </svg>
  );

  if (variant === 'diagram') return (
    <svg width="100%" height="100%" viewBox={viewBox} style={{ position: 'absolute', inset: 0 }}>
      <text x="88" y="80" fontFamily="Newsreader, serif" fontSize="24" fontWeight="600" fill="#1c1814">System diagram</text>
      <path d="M88 92 Q220 88, 350 92" stroke="#b35040" strokeWidth="1.6" fill="none"/>

      <g fill="none" stroke="#1c1814" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="88" y="140" width="180" height="84" rx="4" fill="rgba(72,100,136,0.04)"/>
        <rect x="328" y="140" width="180" height="84" rx="4" fill="rgba(179,80,64,0.04)"/>
        <rect x="208" y="320" width="180" height="84" rx="4" fill="rgba(92,112,88,0.06)"/>
        <path d="M178 224 L268 320 M238 300 L268 320 L248 316"/>
        <path d="M418 224 L328 320 M348 316 L328 320 L328 300"/>
      </g>
      <g fontFamily="Newsreader, serif" fontSize="15" fill="#1c1814">
        <text x="148" y="190">iPad app</text>
        <text x="378" y="190">Windows PC</text>
        <text x="262" y="370">Shared web</text>
      </g>
      <g fontFamily="Geist, sans-serif" fontSize="10" fill="#897e6e">
        <text x="148" y="208">SwiftUI · WKWebView</text>
        <text x="378" y="208">Electron · MJPEG</text>
        <text x="248" y="388">HTML / CSS / JS</text>
      </g>

      <g fill="none" stroke="#897e6e" strokeWidth="1.3" strokeDasharray="4 3">
        <path d="M148 470 Q180 450, 240 460 T340 470"/>
      </g>
      <text x="148" y="498" fontFamily="Newsreader, serif" fontSize="13" fill="#5c7058" fontStyle="italic">local WiFi · ~12 ms round-trip</text>

      <g fill="none" stroke="#1c1814" strokeWidth="1.4" strokeLinecap="round">
        <path d="M88 560 L92 558 Q94 565, 96 560 M104 558 L104 568 M112 560 L112 568 M120 562 Q128 558, 130 566"/>
      </g>
    </svg>
  );

  if (variant === 'sketch') return (
    <svg width="100%" height="100%" viewBox={viewBox} style={{ position: 'absolute', inset: 0 }}>
      <g fill="none" stroke="#1c1814" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {/* loose plant sketch */}
        <path d="M280 540 Q282 460, 300 380 Q310 320, 320 280"/>
        <path d="M280 540 Q278 470, 264 410 Q258 380, 250 360"/>
        <path d="M320 280 Q300 250, 270 260 Q250 268, 256 290 Q266 310, 290 300"/>
        <path d="M306 320 Q286 300, 260 312 Q244 322, 254 340 Q268 354, 290 344"/>
        <path d="M294 380 Q272 360, 248 376 Q234 390, 248 408 Q266 420, 286 408"/>
        <path d="M272 420 Q250 408, 232 422 Q220 436, 234 452 Q250 462, 270 450"/>
        {/* pot */}
        <path d="M232 540 L344 540 L334 600 L242 600 Z"/>
        <path d="M228 540 L348 540"/>
      </g>
      <text x="88" y="100" fontFamily="Newsreader, serif" fontSize="22" fontWeight="600" fill="#1c1814" fontStyle="italic">Window light</text>
      <text x="88" y="124" fontFamily="Newsreader, serif" fontSize="12" fill="#897e6e" fontStyle="italic">studio · 4:12 pm</text>
    </svg>
  );

  if (variant === 'lecture') return (
    <svg width="100%" height="100%" viewBox={viewBox} style={{ position: 'absolute', inset: 0 }}>
      <g fill="none" stroke="#1c1814" strokeWidth="2" strokeLinecap="round">
        <path d="M70 90 L70 122 M70 106 L94 106 M94 90 L94 122"/>
        <path d="M108 90 L108 122 M108 90 L130 116 M130 90 L130 122"/>
        <path d="M150 92 Q142 96, 142 108 Q142 122, 156 122 Q170 122, 170 108 Q170 94, 156 92 Z" fill="rgba(0,0,0,0)"/>
      </g>
      <path d="M65 138 Q140 134, 220 138" stroke="#486488" strokeWidth="1.6" fill="none"/>

      <g fill="none" stroke="#1c1814" strokeWidth="1.6" strokeLinecap="round">
        <text x="74" y="190" fontFamily="Newsreader, serif" fontSize="14" stroke="none" fill="#1c1814">1.</text>
        <path d="M104 178 Q108 185, 106 195 M118 176 L118 200 M128 180 Q136 178, 138 188 Q138 198, 128 196 M148 176 L148 200 M158 180 L154 198 M168 184 Q176 178, 178 192"/>
      </g>
      <rect x="98" y="208" width="240" height="26" fill="#d6b25a" opacity="0.35"/>

      <g fill="none" stroke="#1c1814" strokeWidth="1.6" strokeLinecap="round">
        <text x="74" y="260" fontFamily="Newsreader, serif" fontSize="14" stroke="none" fill="#1c1814">2.</text>
        <path d="M104 248 Q108 256, 106 266 M118 246 L118 270 M128 250 L124 270 M138 254 Q146 248, 148 262"/>
      </g>

      <g fill="none" stroke="#5c7058" strokeWidth="1.5">
        <text x="430" y="100" fontFamily="Newsreader, serif" fontSize="12" fill="#5c7058" fontStyle="italic" stroke="none">→ remember</text>
        <path d="M420 90 Q415 100, 420 110"/>
      </g>
    </svg>
  );

  if (variant === 'recipe') return (
    <svg width="100%" height="100%" viewBox={viewBox} style={{ position: 'absolute', inset: 0 }}>
      <text x="80" y="100" fontFamily="Newsreader, serif" fontSize="26" fontWeight="600" fontStyle="italic" fill="#1c1814">Sourdough · loaf</text>
      <path d="M76 116 Q220 112, 360 118" stroke="#b35040" strokeWidth="1.6" fill="none"/>
      <g fontFamily="Newsreader, serif" fontSize="14" fill="#1c1814">
        <text x="80" y="180">500g  bread flour</text>
        <text x="80" y="208">375g  water · 78°</text>
        <text x="80" y="236">100g  starter · ripe</text>
        <text x="80" y="264">10g    salt</text>
      </g>
      <g fill="none" stroke="#5c7058" strokeWidth="1.6">
        <circle cx="460" cy="200" r="50"/>
        <path d="M440 210 Q460 188, 480 210" opacity="0.5"/>
        <path d="M448 195 Q460 200, 470 196" opacity="0.4"/>
      </g>
      <text x="445" y="282" fontFamily="Newsreader, serif" fontSize="11" fill="#897e6e" fontStyle="italic">ø 22cm</text>
    </svg>
  );

  if (variant === 'blank') return null;
  return null;
}

// ─────────────────────────────────────────────────────────────
// Notebook cover — used across library & nav
// ─────────────────────────────────────────────────────────────
function NotebookCover({ color = '#5c7058', title = 'Field notes', subtitle = '12 pages', width = 152, height = 200 }) {
  // Scale label inset + type based on cover size to keep it readable
  const small = width < 90;
  const medium = width >= 90 && width < 140;
  const inset = small ? { left: 10, right: 6, top: 9, bottom: 9, padding: '6px 5px' }
              : medium ? { left: 16, right: 11, top: 18, bottom: 18, padding: '11px 8px' }
              :         { left: 22, right: 16, top: 26, bottom: 26, padding: '16px 12px' };
  const titleSize = small ? 9 : medium ? 13 : 16;
  const subSize = small ? 7.5 : medium ? 9.5 : 10;
  const showSubtitle = !small;
  const showStamp = width >= 110;
  const titleId = React.useId();
  const patId = `tx${titleId.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div style={{
      width, height, borderRadius: '1px 6px 6px 1px', background: color,
      position: 'relative', flexShrink: 0,
      boxShadow: `inset 2px 0 0 rgba(0,0,0,0.2), inset -1px 0 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.14)`,
      overflow: 'hidden',
    }}>
      {/* spine shadow */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: small ? 6 : 12, background: 'linear-gradient(90deg, rgba(0,0,0,0.28), rgba(0,0,0,0.06) 50%, rgba(0,0,0,0))' }}/>
      {/* fabric texture */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.08, mixBlendMode: 'overlay' }}>
        <defs><pattern id={patId} width="3" height="3" patternUnits="userSpaceOnUse">
          <path d="M0 0L3 3M3 0L0 3" stroke="white" strokeWidth="0.3"/></pattern></defs>
        <rect width="100%" height="100%" fill={`url(#${patId})`}/>
      </svg>
      {/* label */}
      <div style={{
        position: 'absolute', ...inset,
        border: '0.5px solid rgba(255,255,255,0.32)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: titleSize, fontWeight: 600,
            color: 'rgba(255,255,255,0.96)', letterSpacing: -0.2, lineHeight: 1.15, fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: small ? 1 : 2, WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}>{title}</div>
          {showSubtitle && (
            <div style={{ fontSize: subSize, color: 'rgba(255,255,255,0.62)', marginTop: medium ? 5 : 8, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
          )}
        </div>
        {showStamp && (
          <div style={{
            fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>NoteBridge</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Template mini — small preview of paper template
// ─────────────────────────────────────────────────────────────
function TemplateMini({ kind }) {
  if (kind === 'blank') return null;
  if (kind === 'dotted') return (
    <svg width="100%" height="100%" style={{ opacity: 0.55 }}>
      <defs><pattern id="m-dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#b0a48d"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#m-dots)"/>
    </svg>
  );
  if (kind === 'ruled') return (
    <svg width="100%" height="100%" viewBox="0 0 60 80">
      {[12, 20, 28, 36, 44, 52, 60, 68].map(y => <line key={y} x1="8" x2="54" y1={y} y2={y} stroke="#bcc8d8" strokeWidth=".4"/>)}
      <line x1="12" x2="12" y1="0" y2="80" stroke="#d4a8a0" strokeWidth=".4"/>
    </svg>
  );
  if (kind === 'squared') return (
    <svg width="100%" height="100%" style={{ opacity: 0.65 }}>
      <defs><pattern id="m-sq" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M7 0H0v7" fill="none" stroke="#c0b39a" strokeWidth=".4"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#m-sq)"/>
    </svg>
  );
  if (kind === 'cornell') return (
    <svg width="100%" height="100%" viewBox="0 0 60 80">
      <line x1="20" x2="20" y1="10" y2="66" stroke="#c0b39a" strokeWidth=".5"/>
      <line x1="6" x2="54" y1="66" y2="66" stroke="#c0b39a" strokeWidth=".5"/>
      <line x1="6" x2="54" y1="10" y2="10" stroke="#c0b39a" strokeWidth=".5"/>
    </svg>
  );
  if (kind === 'three-col') return (
    <svg width="100%" height="100%" viewBox="0 0 60 80">
      <line x1="22" x2="22" y1="6" y2="74" stroke="#c0b39a" strokeWidth=".5"/>
      <line x1="40" x2="40" y1="6" y2="74" stroke="#c0b39a" strokeWidth=".5"/>
    </svg>
  );
  return null;
}

Object.assign(window, {
  TOOLS, COLORS, SIZES, COVER_COLORS,
  I, StatusTime, StatusTrailing, StatusPill,
  ToolBtn, PenWell, PaperPage, SampleInk, NotebookCover, TemplateMini,
});
