// NoteBridge — main canvas prototype (interactive, stateful)
// Apple-styled Windows desktop app, GoodNotes benchmark.

const NB_TOOLS = [
  { id: 'pen', label: 'Pen' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'eraser', label: 'Eraser' },
  { id: 'lasso', label: 'Lasso' },
  { id: 'text', label: 'Text' },
  { id: 'shape', label: 'Shape' },
  { id: 'hand', label: 'Hand' },
];

const NB_COLORS = [
  '#1a1714', // ink
  '#b85544', // red
  '#4a6890', // blue
  '#5a7058', // sage
  '#c4a878', // tan
  '#e8c66a', // yellow
  '#8b6aa8', // plum
  '#cc7a5a', // terracotta
];

const NB_SIZES = [2, 3, 5, 8, 12];

// ─────────────────────────────────────────────────────────────
// Icons — minimal stroke set, no emoji
// ─────────────────────────────────────────────────────────────
const Ic = {
  pen: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M14.5 2.5l3 3-10 10L4 16l.5-3.5 10-10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M12.5 4.5l3 3" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  highlighter: (p={}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M5 14l-1.5 3.5h4L9 14M5 14l7-7 3 3-7 7H5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M12 7l2-2 3 3-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
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
      <path d="M4 4h12M10 4v12M7 16h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  ),
  chevron: (dir='down', p={}) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...p}>
      <path d={dir==='down'?'M2 4l3 3 3-3':dir==='left'?'M6 2L3 5l3 3':dir==='right'?'M4 2l3 3-3 3':'M2 6l3-3 3 3'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sidebar: (p={}) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}>
      <rect x="2.5" y="3.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 3.5v11" stroke="currentColor" strokeWidth="1.4"/>
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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9.2 9.2L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  star: (p={}) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 1.5l1.7 3.5 3.8.5-2.7 2.7.6 3.8L7 10.2 3.6 12l.6-3.8L1.5 5.5l3.8-.5L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Window chrome — Apple-style, but it's the Windows app
// ─────────────────────────────────────────────────────────────
// iOS landscape status bar — time on left, signal/wifi/battery on right.
// Sits inside the top bar of each screen.
function NBStatusBar({ time='9:41', dark=false }) {
  const c = dark ? '#fff' : 'rgba(26,23,20,0.88)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-ui)' }}>
      <span style={{
        fontSize: 14, fontWeight: 600, color: c, letterSpacing: -0.1,
        fontVariantNumeric: 'tabular-nums',
      }}>{time}</span>
    </div>
  );
}

function NBStatusBarTrailing({ dark=false }) {
  const c = dark ? '#fff' : 'rgba(26,23,20,0.88)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      {/* signal bars */}
      <svg width="17" height="11" viewBox="0 0 17 11">
        <rect x="0" y="7" width="3" height="4" rx="0.6" fill={c}/>
        <rect x="4.5" y="5" width="3" height="6" rx="0.6" fill={c}/>
        <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill={c}/>
        <rect x="13.5" y="0" width="3" height="11" rx="0.6" fill={c}/>
      </svg>
      {/* wifi */}
      <svg width="16" height="11" viewBox="0 0 16 11">
        <path d="M8 3C10 3 11.8 3.8 13.2 5L14.2 4C12.6 2.4 10.4 1.4 8 1.4C5.6 1.4 3.4 2.4 1.8 4L2.8 5C4.2 3.8 6 3 8 3Z" fill={c}/>
        <path d="M8 6.2C9.2 6.2 10.3 6.6 11.1 7.4L12.1 6.4C10.95 5.3 9.55 4.6 8 4.6C6.45 4.6 5.05 5.3 3.9 6.4L4.9 7.4C5.7 6.6 6.8 6.2 8 6.2Z" fill={c}/>
        <circle cx="8" cy="9.5" r="1.4" fill={c}/>
      </svg>
      {/* battery */}
      <svg width="26" height="12" viewBox="0 0 26 12">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={c} strokeOpacity="0.4" fill="none"/>
        <rect x="2" y="2" width="19" height="8" rx="1.6" fill={c}/>
        <path d="M24 4v4c.7-.25 1.3-1 1.3-2s-.6-1.75-1.3-2Z" fill={c} fillOpacity="0.4"/>
      </svg>
    </div>
  );
}

// kept as no-op alias so existing call sites stop rendering traffic lights
function NBTrafficLights() { return null; }

// ─────────────────────────────────────────────────────────────
// Tool button
// ─────────────────────────────────────────────────────────────
function ToolBtn({ icon, active, onClick, size=36, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: size, height: size, borderRadius: 8, border: 'none',
      background: active ? 'rgba(26,23,20,0.08)' : 'transparent',
      color: active ? 'var(--ink)' : 'var(--ink-soft)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background .12s',
    }}
    onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(26,23,20,0.04)';}}
    onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent';}}>
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Paper page renderer — with templates and sample ink
// ─────────────────────────────────────────────────────────────
function PaperPage({ template='dotted', width=560, height=720, children, scale=1 }) {
  let pattern = null;
  if (template === 'dotted') {
    pattern = (
      <svg width="100%" height="100%" style={{position:'absolute',inset:0,opacity:.35}}>
        <defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#b8ad9a"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
      </svg>
    );
  } else if (template === 'ruled') {
    const lines = [];
    for (let y=48; y<height; y+=32) lines.push(<line key={y} x1="40" x2={width-40} y1={y} y2={y} stroke="#cbb9d4" strokeOpacity=".5" strokeWidth="0.7"/>);
    pattern = <svg width="100%" height="100%" style={{position:'absolute',inset:0}}>{lines}<line x1="56" x2="56" y1="0" y2={height} stroke="#d4a8a0" strokeOpacity=".5" strokeWidth="0.7"/></svg>;
  } else if (template === 'squared') {
    pattern = (
      <svg width="100%" height="100%" style={{position:'absolute',inset:0,opacity:.4}}>
        <defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0v22" fill="none" stroke="#c5b8a3" strokeWidth="0.6"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    );
  } else if (template === 'cornell') {
    pattern = (
      <svg width="100%" height="100%" style={{position:'absolute',inset:0}}>
        <line x1={width*0.3} x2={width*0.3} y1={70} y2={height-90} stroke="#c5b8a3" strokeWidth="0.8"/>
        <line x1={20} x2={width-20} y1={height-90} y2={height-90} stroke="#c5b8a3" strokeWidth="0.8"/>
        <line x1={20} x2={width-20} y1={70} y2={70} stroke="#c5b8a3" strokeWidth="0.8"/>
      </svg>
    );
  }

  return (
    <div style={{
      width, height, background: 'var(--paper)', position: 'relative',
      boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06), 0 24px 64px rgba(0,0,0,.04)',
      borderRadius: 2, overflow: 'hidden',
      transform: scale!==1 ? `scale(${scale})` : undefined,
      transformOrigin: 'top left',
    }}>
      {pattern}
      <div style={{position:'relative', width:'100%', height:'100%'}}>{children}</div>
    </div>
  );
}

// Sample ink — handwritten-feel SVG strokes
function SampleInk({ variant='meeting' }) {
  if (variant === 'meeting') return (
    <svg width="100%" height="100%" viewBox="0 0 560 720" style={{position:'absolute',inset:0}}>
      {/* Title — "Q3 Planning" handwritten */}
      <g fill="none" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M55 90 Q60 78, 80 78 T120 88 Q120 100, 105 105 Q90 108, 92 95"/>
        <path d="M120 88 Q132 96, 132 78 Q132 70, 124 82 Q120 90, 128 108"/>
        <path d="M155 75 L155 108 M155 90 L175 90 M175 75 L175 108"/>
        <path d="M195 76 L195 108 M210 76 L210 108 M195 90 L210 90"/>
        <path d="M230 76 Q224 82, 230 90 Q236 95, 230 102 Q224 106, 228 108 L250 108"/>
        <path d="M270 76 L268 108 M280 80 Q288 76, 290 88 Q290 100, 278 100"/>
        <path d="M310 78 Q302 78, 300 90 Q298 105, 312 108 Q322 106, 322 95 Q322 84, 312 80"/>
        <path d="M345 78 Q336 80, 336 92 Q336 105, 348 106 Q360 106, 360 92"/>
      </g>
      {/* underline */}
      <path d="M50 124 Q200 120, 360 126" stroke="#b85544" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* bullets — three lines of "writing" */}
      <g fill="none" stroke="#1a1714" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="70" cy="180" r="2.5" fill="#1a1714"/>
        <path d="M88 170 Q92 175, 90 184 M100 168 L100 188 Q104 188, 106 178 Q108 168, 100 172 M118 174 Q113 174, 113 184 Q113 192, 122 188 M132 168 L132 192 M142 170 L138 192 M156 180 Q156 168, 166 172 Q170 180, 162 184 L172 192 M180 168 L180 192 M188 178 Q198 170, 200 184 Q200 195, 188 192"/>
        <path d="M218 172 Q214 184, 224 184 Q232 184, 226 172 M240 168 L240 192 M250 170 L246 192 M266 174 Q260 178, 264 188 Q272 192, 274 180"/>

        <circle cx="70" cy="222" r="2.5" fill="#1a1714"/>
        <path d="M88 212 Q92 218, 92 226 M104 210 L104 232 M112 214 Q120 214, 122 224 Q120 234, 110 232 M138 210 L138 234 M148 218 L142 232 M160 222 Q170 215, 172 228 M186 210 L186 234 Q194 234, 196 222 Q196 210, 190 212"/>

        <circle cx="70" cy="264" r="2.5" fill="#1a1714"/>
        <path d="M88 254 Q92 262, 92 274 M104 252 L104 278 M115 254 L115 278 M126 258 Q120 264, 124 274 Q132 278, 134 268 M148 252 L148 278 M158 258 L154 278 M172 264 Q182 254, 182 270 Q182 282, 170 278 M198 252 L198 280 M212 254 L208 280 M228 264 Q220 268, 224 278 Q232 280, 234 270"/>
      </g>

      {/* arrow + box */}
      <g fill="none" stroke="#b85544" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="56" y="324" width="200" height="60" rx="3" fill="rgba(184,84,68,0.05)"/>
        <path d="M68 348 Q75 342, 82 346 Q88 350, 95 346 M105 342 L105 356 M114 344 L110 358 M124 348 Q132 344, 134 354 M148 342 L148 358 M158 344 L154 360"/>
        <path d="M68 368 Q74 363, 80 367 L88 367 M98 361 L98 377 M110 363 L106 379 M124 367 Q132 363, 134 373"/>
      </g>
      <path d="M280 348 L420 348 M412 342 L420 348 L412 354" stroke="#4a6890" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* sketch on the right — simple flowchart */}
      <g fill="none" stroke="#5a7058" strokeWidth="1.6">
        <circle cx="460" cy="200" r="32"/>
        <circle cx="460" cy="290" r="32"/>
        <path d="M460 232 L460 258 M454 252 L460 258 L466 252"/>
      </g>
      <g fill="#5a7058" stroke="none" fontFamily="var(--font-display)" fontSize="11">
        <text x="446" y="204">iPad</text>
        <text x="442" y="294">Win</text>
      </g>

      {/* highlighter swipe */}
      <rect x="50" y="445" width="240" height="14" fill="#e8c66a" opacity="0.45"/>
      <g fill="none" stroke="#1a1714" strokeWidth="1.6" strokeLinecap="round">
        <path d="M62 455 Q66 448, 70 455 M78 446 L78 460 M88 448 L84 462 M100 452 Q108 446, 110 458 M124 446 L124 460 M134 448 L130 462 M148 452 Q140 456, 144 466 M170 446 L170 462 M180 448 L184 460 L188 448 M198 446 L198 462 M208 448 L208 462 M218 452 Q224 446, 228 456 Q228 466, 216 462 M244 446 L244 462 M254 448 L250 462"/>
      </g>

      {/* page footer */}
      <text x="50" y="690" fill="#8a8175" fontSize="11" fontFamily="var(--font-display)" fontStyle="italic">May 12, 2026 · Q3 planning sync</text>
    </svg>
  );

  if (variant === 'diagram') return (
    <svg width="100%" height="100%" viewBox="0 0 560 720" style={{position:'absolute',inset:0}}>
      <g fill="none" stroke="#1a1714" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="80" y="120" width="180" height="80" rx="4"/>
        <rect x="320" y="120" width="180" height="80" rx="4"/>
        <rect x="200" y="290" width="180" height="80" rx="4"/>
        <path d="M170 200 L260 290 M230 270 L260 290 L240 286"/>
        <path d="M410 200 L320 290 M340 286 L320 290 L320 270"/>
      </g>
      <g fontFamily="var(--font-display)" fontSize="15" fill="#1a1714">
        <text x="138" y="166">iPad</text>
        <text x="378" y="166">Windows</text>
        <text x="252" y="336">Shared</text>
      </g>
      <text x="80" y="80" fontFamily="var(--font-display)" fontSize="22" fontWeight="600" fill="#1a1714">System architecture</text>
      <path d="M80 92 Q200 88, 320 92" stroke="#b85544" strokeWidth="1.6" fill="none"/>

      <g fill="none" stroke="#8a8175" strokeWidth="1.4" strokeDasharray="4 3">
        <path d="M120 440 Q140 420, 200 430 T280 440"/>
      </g>
      <text x="120" y="478" fontFamily="var(--font-display)" fontSize="13" fill="#5a7058" fontStyle="italic">over local WiFi · ~12 ms</text>
    </svg>
  );

  if (variant === 'blank') return null;

  return null;
}

window.NB_TOOLS = NB_TOOLS;
window.NB_COLORS = NB_COLORS;
window.NB_SIZES = NB_SIZES;
window.NBIc = Ic;
window.NBTrafficLights = NBTrafficLights;
window.NBToolBtn = ToolBtn;
window.NBPaperPage = PaperPage;
window.NBSampleInk = SampleInk;
