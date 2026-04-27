// NoteBridge Hi-Fi — Design Tokens + Shared Components

const T = {
  // Accent — Warm Terracotta (tweakable)
  accent: '#c07850',
  accentBg: 'rgba(192,120,80,0.10)',
  accentBorder: 'rgba(192,120,80,0.28)',

  // iOS Light
  bg: '#ffffff',
  groupBg: '#f2f2f7',
  label:  '#000000',
  label2: 'rgba(60,60,67,0.60)',
  label3: 'rgba(60,60,67,0.30)',
  sep:    'rgba(60,60,67,0.20)',
  fill:   '#f2f2f7',
  fill2:  '#e5e5ea',

  // Frosted glass (ultraThinMaterial equivalent)
  glass:     'rgba(252,250,248,0.80)',
  glassBlur: 'blur(20px) saturate(1.8)',
  glassBorder: '0.5px solid rgba(255,255,255,0.60)',

  // Windows 11 dark
  wBg:          '#1c1c1c',
  wSurface:     '#252525',
  wPanel:       '#2e2e2e',
  wHover:       '#3a3a3a',
  wBorder:      'rgba(255,255,255,0.083)',
  wBorderB:     'rgba(255,255,255,0.16)',
  wFg:          'rgba(255,255,255,0.956)',
  wFgDim:       'rgba(255,255,255,0.54)',
  wFgDimmer:    'rgba(255,255,255,0.28)',
  wSep:         'rgba(255,255,255,0.083)',

  // Type
  ios: "-apple-system,'SF Pro Display','SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif",
  win: "'Segoe UI','Segoe UI Variable',system-ui,sans-serif",

  // Shadows
  card:   '0 1px 4px rgba(0,0,0,0.06), 0 6px 18px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06)',
  sheet:  '0 -4px 32px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.04)',
  pill:   '0 2px 14px rgba(0,0,0,0.32)',
  winShadow: '0 8px 40px rgba(0,0,0,0.5)',
};

// Notebook cover palettes (muted, warm, pairs with terracotta)
const COVERS = [
  'linear-gradient(150deg,#547088 0%,#3e5870 100%)',
  'linear-gradient(150deg,#6a8a70 0%,#507860 100%)',
  'linear-gradient(150deg,#7a6070 0%,#624855 100%)',
  'linear-gradient(150deg,#c07850 0%,#9e5e38 100%)',
  'linear-gradient(150deg,#384858 0%,#263445 100%)',
  'linear-gradient(150deg,#6a6250 0%,#58503e 100%)',
];

// ── SVG Icons ──────────────────────────────────────────────────────────────────

const PenIcon = ({ size=22, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{display:'block'}}>
    <path d="M15.5 3.5 18.5 6.5 8 17l-3.5.5.5-3.5z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 6l3 3" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const EraserIcon = ({ size=22, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{display:'block'}}>
    <path d="M4 18h14" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M14 4.5 18 8.5 10 16.5H6l-2-2 8-10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TextIcon = ({ size=22, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{display:'block'}}>
    <path d="M5 6h12M11 6v11" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.5 17h7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UndoIcon = ({ size=20, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{display:'block'}}>
    <path d="M3.5 8C5.5 5 9.5 3 13.5 5 17.5 7 18 12.5 15.5 16" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M3.5 4v4h4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RedoIcon = ({ size=20, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{display:'block'}}>
    <path d="M16.5 8C14.5 5 10.5 3 6.5 5 2.5 7 2 12.5 4.5 16" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M16.5 4v4h-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PagesIcon = ({ size=20, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{display:'block'}}>
    <rect x="4" y="3" width="10" height="13" rx="2" stroke={color} strokeWidth="1.5"/>
    <rect x="6" y="5" width="10" height="13" rx="2" stroke={color} strokeWidth="1.5" fill="white"/>
    <path d="M9 9h4M9 12h3" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const ChevronLeft = ({ size=18, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{display:'block'}}>
    <path d="M11 5L7 9l4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRight = ({ size=18, color='#000' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{display:'block'}}>
    <path d="M7 5l4 4-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = ({ size=18, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{display:'block'}}>
    <path d="M9 4v10M4 9h10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const EllipsisIcon = ({ size=20, color='#000', horizontal=true }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{display:'block'}}>
    {horizontal
      ? <><circle cx="5" cy="10" r="1.5" fill={color}/><circle cx="10" cy="10" r="1.5" fill={color}/><circle cx="15" cy="10" r="1.5" fill={color}/></>
      : <><circle cx="10" cy="5" r="1.5" fill={color}/><circle cx="10" cy="10" r="1.5" fill={color}/><circle cx="10" cy="15" r="1.5" fill={color}/></>
    }
  </svg>
);

// ── Shared UI ──────────────────────────────────────────────────────────────────

const HiStatusPill = ({ device='DESKTOP-PC7K', latency='14ms', accentColor=T.accent }) => (
  <div style={{
    display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(18,16,14,0.76)',
    backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
    borderRadius:100, border:'0.5px solid rgba(255,255,255,0.16)',
    padding:'5px 12px 5px 9px', boxShadow:T.pill,
  }}>
    <div style={{width:8,height:8,borderRadius:'50%',background:'#34c759',
      boxShadow:'0 0 6px rgba(52,199,89,0.7)'}}/>
    <span style={{fontFamily:T.ios, fontSize:13, fontWeight:500, color:'#fff', letterSpacing:'-0.1px'}}>{device}</span>
    <span style={{fontFamily:T.ios, fontSize:12, color:'rgba(255,255,255,0.44)'}}>{latency}</span>
    <span style={{fontFamily:T.ios, fontSize:14, color:'rgba(255,255,255,0.35)', marginLeft:1, lineHeight:1}}>×</span>
  </div>
);

// Notebook card (iPad hi-fi)
const HiNotebookCard = ({ title, pages, date, coverIdx=0, w=200, h=260, accentColor=T.accent, style={} }) => {
  const spineColor = coverIdx === 3 ? 'rgba(255,255,255,0.35)' : accentColor;
  return (
    <div style={{ width:w, height:h, borderRadius:14, overflow:'hidden',
      background:'#fff', boxShadow:T.card, flexShrink:0, ...style }}>
      <div style={{ height:h*0.62, background:COVERS[coverIdx%COVERS.length], position:'relative', overflow:'hidden' }}>
        {/* Highlight */}
        <div style={{ position:'absolute',top:0,left:0,right:0,height:'35%',
          background:'linear-gradient(180deg,rgba(255,255,255,0.14) 0%,transparent 100%)' }}/>
        {/* Spine */}
        <div style={{ position:'absolute',left:0,top:0,bottom:0,width:7, background:spineColor }}/>
        {/* Page stack shadow at bottom */}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:12,
          background:'rgba(0,0,0,0.18)' }}/>
      </div>
      <div style={{ padding:'10px 14px 12px' }}>
        <div style={{ fontFamily:T.ios, fontSize:15, fontWeight:600, color:T.label,
          letterSpacing:'-0.2px', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {title}
        </div>
        <div style={{ fontFamily:T.ios, fontSize:12, color:T.label2 }}>{pages}</div>
        <div style={{ fontFamily:T.ios, fontSize:11, color:T.label3, marginTop:1 }}>{date}</div>
      </div>
    </div>
  );
};

// Canvas dotted template overlay
const CanvasDots = ({ opacity=0.14, spacing=22 }) => (
  <div style={{
    position:'absolute', inset:0, pointerEvents:'none',
    backgroundImage:'radial-gradient(circle, rgba(0,0,0,0.65) 1px, transparent 1px)',
    backgroundSize:`${spacing}px ${spacing}px`, opacity,
  }}/>
);

// iPad device frame
const IPadFrame = ({ children, landscape=false }) => (
  <div style={{
    width: landscape?1024:768, height: landscape?768:1024,
    borderRadius:22,
    border:'1.5px solid rgba(0,0,0,0.14)',
    background:'#fff', overflow:'hidden',
    display:'flex', flexDirection:'column',
    boxShadow:'0 0 0 1px rgba(0,0,0,0.04), 0 12px 48px rgba(0,0,0,0.12)',
  }}>
    {/* Status bar */}
    <div style={{ height:24, background:T.glass,
      backdropFilter:T.glassBlur, WebkitBackdropFilter:T.glassBlur,
      borderBottom:`0.5px solid ${T.sep}`,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 20px', flexShrink:0 }}>
      <span style={{ fontFamily:T.ios, fontSize:12, fontWeight:600, color:T.label }}>9:41</span>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="3" width="3" height="9" rx="1" fill={T.label} opacity="0.4"/>
          <rect x="4.5" y="2" width="3" height="10" rx="1" fill={T.label} opacity="0.55"/>
          <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill={T.label} opacity="0.75"/>
          <rect x="13.5" y="0.5" width="3" height="11.5" rx="1" fill={T.label}/>
        </svg>
        <span style={{ fontFamily:T.ios, fontSize:12, fontWeight:400, color:T.label }}>WiFi</span>
        <span style={{ fontFamily:T.ios, fontSize:12, fontWeight:400, color:T.label }}>74%</span>
      </div>
    </div>
    {children}
  </div>
);

// iOS Navigation Bar
const IOSNavBar = ({ title, leftItem, rightItems=[], borderBottom=true, bg=T.glass }) => (
  <div style={{
    height:52, display:'flex', alignItems:'center', padding:'0 16px', gap:10,
    background:bg, backdropFilter:T.glassBlur, WebkitBackdropFilter:T.glassBlur,
    borderBottom: borderBottom ? `0.5px solid ${T.sep}` : 'none', flexShrink:0,
  }}>
    <div style={{ minWidth:90 }}>{leftItem}</div>
    <div style={{ flex:1, textAlign:'center', fontFamily:T.ios, fontSize:17, fontWeight:600,
      color:T.label, letterSpacing:'-0.3px' }}>{title}</div>
    <div style={{ minWidth:90, display:'flex', justifyContent:'flex-end', gap:10 }}>{rightItems}</div>
  </div>
);

// iOS tappable text button
const IOSTxtBtn = ({ label, color, bold=false, style={} }) => (
  <span style={{ fontFamily:T.ios, fontSize:17, color:color||T.accent,
    fontWeight:bold?600:400, cursor:'pointer', letterSpacing:'-0.2px', ...style }}>
    {label}
  </span>
);

// Glass sheet handle
const SheetHandle = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px' }}>
    <div style={{ width:36, height:4, borderRadius:2, background:'rgba(60,60,67,0.18)' }}/>
  </div>
);

// Windows frame
const WinFrame = ({ children, title='NoteBridge', subtitle='', w=1200, h=750 }) => (
  <div style={{
    width:w, height:h, borderRadius:8,
    border:`1px solid ${T.wBorderB}`,
    background:T.wBg, overflow:'hidden',
    display:'flex', flexDirection:'column',
    boxShadow:T.winShadow,
  }}>
    {/* Title bar */}
    <div style={{ height:32, background:'#141414',
      borderBottom:`1px solid ${T.wBorder}`,
      display:'flex', alignItems:'center', padding:'0 12px', gap:8, flexShrink:0 }}>
      {/* macOS-style dots for mockup clarity */}
      {['#ff5f57','#febc2e','#28c840'].map(c=>(
        <div key={c} style={{ width:11,height:11,borderRadius:'50%',background:c,
          border:'0.5px solid rgba(0,0,0,0.25)' }}/>
      ))}
      <span style={{ fontFamily:T.win, fontSize:13, fontWeight:400, color:T.wFgDim, marginLeft:6,
        userSelect:'none' }}>
        NoteBridge{subtitle && ` — ${subtitle}`}
      </span>
    </div>
    {children}
  </div>
);

Object.assign(window, {
  T, COVERS,
  PenIcon, EraserIcon, TextIcon, UndoIcon, RedoIcon,
  PagesIcon, ChevronLeft, ChevronRight, PlusIcon, EllipsisIcon,
  HiStatusPill, HiNotebookCard, CanvasDots,
  IPadFrame, IOSNavBar, IOSTxtBtn, SheetHandle, WinFrame,
});
