// NoteBridge Hi-Fi — Windows Screens

// ── Windows primitives ────────────────────────────────────────────────────────

const WBtn = ({ label, icon, w, h=28, accent=false, accentColor=T.accent,
  dim=false, kbd, style={} }) => {
  const bg = accent ? accentColor : T.wPanel;
  const fg = accent ? '#fff' : (dim ? T.wFgDim : T.wFg);
  return (
    <div title={kbd ? `${label} (${kbd})` : label} style={{
      height:h, minWidth:w||'auto', borderRadius:5,
      border: accent ? `1px solid ${accentColor}` : `1px solid ${T.wBorderB}`,
      background:bg, display:'flex', alignItems:'center', justifyContent:'center',
      gap:5, padding:'0 9px', cursor:'pointer', flexShrink:0,
      fontFamily:T.win, fontSize:12, fontWeight: accent?600:400, color:fg,
      whiteSpace:'nowrap', userSelect:'none', ...style,
    }}>
      {icon && <span style={{display:'flex',alignItems:'center'}}>{icon}</span>}
      {label}
      {kbd && <span style={{ fontSize:10, opacity:0.45, marginLeft:1 }}>{kbd}</span>}
    </div>
  );
};

const WDivider = ({ style={} }) => (
  <div style={{ width:1, alignSelf:'stretch', margin:'4px 2px',
    background:T.wBorder, flexShrink:0, ...style }}/>
);

// Ribbon group: children + label at bottom
const RibbonGroup = ({ label, children, style={} }) => (
  <div style={{
    display:'flex', flexDirection:'column', padding:'4px 8px 0',
    borderRight:`1px solid ${T.wBorder}`, flexShrink:0,
    ...style,
  }}>
    <div style={{ flex:1, display:'flex', alignItems:'center', gap:4 }}>{children}</div>
    <div style={{ textAlign:'center', fontFamily:T.win, fontSize:10,
      color:T.wFgDimmer, padding:'3px 0 4px', letterSpacing:'0.2px' }}>
      {label}
    </div>
  </div>
);

// Ribbon tool button (icon + label stacked)
const RibbonTool = ({ Icon, label, selected=false, accentColor=T.accent, size=20 }) => (
  <div style={{
    display:'flex', flexDirection:'column', alignItems:'center', gap:2,
    padding:'4px 7px', borderRadius:5, cursor:'pointer', minWidth:40,
    background: selected ? `${accentColor}22` : 'transparent',
    border: selected ? `1px solid ${accentColor}50` : '1px solid transparent',
  }}>
    <Icon size={size} color={selected ? accentColor : T.wFg}/>
    <span style={{ fontFamily:T.win, fontSize:10, color: selected ? accentColor : T.wFgDim,
      fontWeight: selected?600:400 }}>
      {label}
    </span>
  </div>
);

// Windows color swatches
const WinSwatches = ({ selected=0, accentColor=T.accent }) => {
  const colors = ['#e8e3de','#d63030','#2860d0','#28a050','#df7020','#7838c0','#707070'];
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
      {colors.map((c,i) => (
        <div key={i} style={{
          width:16, height:16, borderRadius:'50%', background:c, flexShrink:0,
          ...(i===selected
            ? { boxShadow:`0 0 0 1.5px ${T.wBg}, 0 0 0 3px ${accentColor}` }
            : { border:'1px solid rgba(255,255,255,0.15)' })
        }}/>
      ))}
    </div>
  );
};

// Windows size dots
const WinSizeDots = ({ selected=1 }) => (
  <div style={{ display:'flex', gap:5, alignItems:'center' }}>
    {[3,5,8,13].map((s,i) => (
      <div key={i} style={{ width:s, height:s, borderRadius:'50%', flexShrink:0,
        background:T.wFg, opacity: i===selected ? 0.88 : 0.22,
        ...(i===selected ? { outline:`2px solid ${T.accent}80`, outlineOffset:2 } : {})
      }}/>
    ))}
  </div>
);

// Windows notebook card
const WinNBCard = ({ title, pages, date, coverIdx=0, accentColor=T.accent, style={} }) => {
  const spineColor = coverIdx===3 ? 'rgba(255,255,255,0.28)' : accentColor;
  return (
    <div style={{
      borderRadius:6, overflow:'hidden', background:T.wSurface,
      border:`1px solid ${T.wBorder}`,
      boxShadow:'0 2px 8px rgba(0,0,0,0.25)', flexShrink:0, ...style,
    }}>
      <div style={{ height:120, background:COVERS[coverIdx%COVERS.length], position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:'35%',
          background:'linear-gradient(180deg,rgba(255,255,255,0.12) 0%,transparent 100%)' }}/>
        <div style={{ position:'absolute',left:0,top:0,bottom:0,width:6,background:spineColor }}/>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:10,background:'rgba(0,0,0,0.2)' }}/>
      </div>
      <div style={{ padding:'8px 11px 10px' }}>
        <div style={{ fontFamily:T.win, fontSize:13, fontWeight:600, color:T.wFg,
          letterSpacing:'-0.1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {title}
        </div>
        <div style={{ fontFamily:T.win, fontSize:11, color:T.wFgDim, marginTop:2 }}>{pages}</div>
        <div style={{ fontFamily:T.win, fontSize:10, color:T.wFgDimmer, marginTop:1 }}>{date}</div>
      </div>
    </div>
  );
};

// Windows canvas content (same web app)
const WinCanvasContent = () => (
  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
    <text x="76" y="60" fontFamily="'Segoe UI',sans-serif" fontSize="22"
      fill="rgba(0,0,0,0.72)" fontWeight="600" letterSpacing="-0.4">Chapter 4: Wave Mechanics</text>
    <line x1="76" y1="70" x2="620" y2="70" stroke="rgba(0,0,0,0.08)" strokeWidth="0.8"/>
    <text x="76" y="100" fontFamily="'Segoe UI',sans-serif" fontSize="14"
      fill="rgba(0,0,0,0.48)">The wave equation describes how waves propagate through space and time.</text>
    <text x="76" y="124" fontFamily="'Segoe UI',sans-serif" fontSize="14"
      fill="rgba(0,0,0,0.48)">ψ(x,t) = A·sin(kx − ωt)</text>
    <path d="M76 185 C160 148,240 225,340 178 S480 210,570 175 S680 196,750 178"
      stroke="rgba(0,0,0,0.22)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    <path d="M370 155 L370 138 L394 128" stroke="rgba(0,0,0,0.18)" strokeWidth="1" fill="none"/>
    <text x="397" y="126" fontFamily="'Segoe UI',sans-serif" fontSize="11" fill="rgba(0,0,0,0.35)">amplitude</text>
  </svg>
);

// ── SCREEN 1: Windows Canvas — Ribbon-Lite ────────────────────────────────────
const WinHiCanvas = ({ accentColor=T.accent }) => (
  <WinFrame subtitle="Physics Notes">
    {/* Ribbon */}
    <div style={{ height:66, background:T.wSurface, borderBottom:`1px solid ${T.wBorder}`,
      display:'flex', alignItems:'stretch', flexShrink:0, overflowX:'auto' }}>

      <RibbonGroup label="File">
        <WBtn label="Notebooks" h={24}/>
      </RibbonGroup>

      <RibbonGroup label="Tools">
        <RibbonTool Icon={PenIcon}    label="Pen"    selected accentColor={accentColor}/>
        <RibbonTool Icon={EraserIcon} label="Eraser" accentColor={accentColor}/>
        <RibbonTool Icon={TextIcon}   label="Text"   accentColor={accentColor}/>
      </RibbonGroup>

      <RibbonGroup label="Colors" style={{ padding:'4px 10px 0' }}>
        <WinSwatches accentColor={accentColor}/>
      </RibbonGroup>

      <RibbonGroup label="Size" style={{ padding:'4px 10px 0' }}>
        <WinSizeDots/>
      </RibbonGroup>

      <RibbonGroup label="Edit">
        <RibbonTool Icon={UndoIcon} label="Undo" accentColor={accentColor} size={18}/>
        <div title="Redo (Ctrl+Y)" style={{opacity:0.3}}>
          <RibbonTool Icon={RedoIcon} label="Redo" accentColor={accentColor} size={18}/>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Insert">
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <WBtn label="🖼  Image" h={22} kbd="Ctrl+I"/>
          <WBtn label="⬇  Export PDF" h={22}/>
        </div>
      </RibbonGroup>

      {/* Spacer */}
      <div style={{ flex:1 }}/>

      <RibbonGroup label="Connection" style={{ borderRight:'none', borderLeft:`1px solid ${T.wBorder}` }}>
        <div style={{
          display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
          background:`rgba(52,199,89,0.14)`, borderRadius:6,
          border:`1px solid rgba(52,199,89,0.3)`,
        }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#34c759',
            boxShadow:'0 0 6px rgba(52,199,89,0.7)', flexShrink:0 }}/>
          <div>
            <div style={{ fontFamily:T.win, fontSize:12, fontWeight:600, color:T.wFg }}>DESKTOP-PC7K</div>
            <div style={{ fontFamily:T.win, fontSize:10, color:T.wFgDim }}>14 ms · Click to disconnect</div>
          </div>
        </div>
      </RibbonGroup>
    </div>

    {/* Canvas */}
    <div style={{ flex:1, position:'relative', background:'#ffffff', overflow:'hidden' }}>
      <CanvasDots opacity={0.12} spacing={22}/>
      <WinCanvasContent/>
    </div>

    {/* Page bar */}
    <div style={{ height:32, background:T.wSurface, borderTop:`1px solid ${T.wBorder}`,
      display:'flex', alignItems:'center', padding:'0 10px', gap:6, flexShrink:0 }}>
      <WBtn label="← Prev" w={62} h={22} kbd="←" dim/>
      <span style={{ fontFamily:T.win, fontSize:12, color:T.wFgDim, padding:'0 4px', minWidth:72, textAlign:'center' }}>
        Page 2 of 8
      </span>
      <WBtn label="Next →" w={62} h={22} kbd="→"/>
      <WDivider/>
      <WBtn label="⊞  Pages" w={66} h={22}/>
      <div style={{ width:1, height:16, background:T.wBorderB }}/>
      <WBtn label="+ Add Page" h={22} accent accentColor={accentColor}/>
      <div style={{ flex:1 }}/>
      <span style={{ fontFamily:T.win, fontSize:11, color:T.wFgDimmer }}>Saved  ·  Apr 23</span>
    </div>
  </WinFrame>
);

// ── SCREEN 2: Windows Home — Grid View ───────────────────────────────────────
const WIN_NOTEBOOKS = [
  { title:'Physics Notes',  pages:'24 pages', date:'2h ago',   coverIdx:0 },
  { title:'Math 202',       pages:'18 pages', date:'Yesterday', coverIdx:1 },
  { title:'History — WW2',  pages:'31 pages', date:'Apr 20',   coverIdx:2 },
  { title:'Design System',  pages:'9 pages',  date:'Apr 19',   coverIdx:3 },
  { title:'Daily Journal',  pages:'45 pages', date:'Apr 18',   coverIdx:4 },
  { title:'Research',       pages:'12 pages', date:'Apr 15',   coverIdx:5 },
];

const WinHiHome = ({ accentColor=T.accent }) => (
  <WinFrame>
    {/* Toolbar */}
    <div style={{ height:38, background:T.wSurface, borderBottom:`1px solid ${T.wBorder}`,
      display:'flex', alignItems:'center', padding:'0 10px', gap:6, flexShrink:0 }}>
      <WBtn label="+ New Notebook" h={26} accent accentColor={accentColor}/>
      <WDivider/>
      {/* View toggle */}
      <div style={{ display:'flex', borderRadius:5, border:`1px solid ${T.wBorderB}`, overflow:'hidden' }}>
        <div style={{ padding:'0 10px', height:24, display:'flex', alignItems:'center',
          background:`${accentColor}22`, borderRight:`1px solid ${T.wBorderB}`,
          fontFamily:T.win, fontSize:12, color:accentColor, cursor:'pointer', fontWeight:600 }}>
          ⊞ Grid
        </div>
        <div style={{ padding:'0 10px', height:24, display:'flex', alignItems:'center',
          fontFamily:T.win, fontSize:12, color:T.wFgDim, cursor:'pointer' }}>
          ≡ List
        </div>
      </div>
      <WDivider/>
      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:6,
        background:T.wPanel, border:`1px solid ${T.wBorderB}`,
        borderRadius:5, padding:'0 10px', height:24, width:200 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke={T.wFgDimmer} strokeWidth="1.3"/>
          <path d="M8 8l2 2" stroke={T.wFgDimmer} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily:T.win, fontSize:12, color:T.wFgDimmer }}>Search notebooks…</span>
      </div>
      <div style={{ flex:1 }}/>
      <WBtn label="Sort: Recent ▾" h={24} dim/>
    </div>

    {/* Grid */}
    <div style={{ flex:1, overflowY:'auto', padding:18,
      display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, alignContent:'start' }}>
      {WIN_NOTEBOOKS.map((nb,i) => (
        <div key={i}>
          <WinNBCard {...nb} accentColor={accentColor} style={{ width:'100%' }}/>
          <div style={{ display:'flex', gap:4, marginTop:5 }}>
            <WBtn label="Open" h={22} w={52} accent accentColor={accentColor}/>
            <WBtn label="Rename" h={22}/>
            <WBtn label="Delete" h={22} style={{ color:'#ff6060', borderColor:'rgba(255,96,96,0.35)' }}/>
          </div>
        </div>
      ))}
      {/* Add new card placeholder */}
      <div style={{ borderRadius:6, border:`1.5px dashed ${T.wBorderB}`,
        height:170, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:8,
        cursor:'pointer', opacity:0.5,
      }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:T.wPanel,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <PlusIcon size={16} color={T.wFgDim}/>
        </div>
        <span style={{ fontFamily:T.win, fontSize:12, color:T.wFgDim }}>New Notebook</span>
      </div>
    </div>

    {/* Status bar */}
    <div style={{ height:22, background:'#141414', borderTop:`1px solid ${T.wBorder}`,
      display:'flex', alignItems:'center', padding:'0 12px', gap:16, flexShrink:0 }}>
      <span style={{ fontFamily:T.win, fontSize:11, color:T.wFgDimmer }}>6 notebooks</span>
      <div style={{ width:1, height:12, background:T.wBorder }}/>
      <span style={{ fontFamily:T.win, fontSize:11, color:T.wFgDimmer }}>All synced</span>
      <div style={{ flex:1 }}/>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:T.wFgDimmer }}/>
        <span style={{ fontFamily:T.win, fontSize:11, color:T.wFgDimmer }}>Not connected to iPad</span>
      </div>
    </div>
  </WinFrame>
);

// ── SCREEN 3: Windows Page Manager modal ─────────────────────────────────────
const WinHiPageManager = ({ accentColor=T.accent }) => (
  <WinFrame subtitle="Physics Notes">
    {/* Ribbon — simplified behind scrim */}
    <div style={{ height:66, background:T.wSurface, borderBottom:`1px solid ${T.wBorder}`,
      display:'flex', alignItems:'center', padding:'0 12px', opacity:0.35, flexShrink:0 }}>
      <span style={{ fontFamily:T.win, fontSize:12, color:T.wFgDim }}>Ribbon…</span>
    </div>
    {/* Canvas + scrim */}
    <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'#fff' }}>
        <CanvasDots opacity={0.10}/>
      </div>
      {/* Modal overlay */}
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1,
        backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)' }}/>
      {/* Modal */}
      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        zIndex:2, width:660, background:T.wSurface,
        border:`1px solid ${T.wBorderB}`, borderRadius:8,
        boxShadow:'0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow:'hidden',
      }}>
        {/* Modal titlebar */}
        <div style={{ height:36, background:T.wPanel, borderBottom:`1px solid ${T.wBorder}`,
          display:'flex', alignItems:'center', padding:'0 14px', gap:10 }}>
          <span style={{ fontFamily:T.win, fontSize:14, fontWeight:600, color:T.wFg, flex:1,
            letterSpacing:'-0.1px' }}>Pages</span>
          <WBtn label="+ Add Page" h={24} accent accentColor={accentColor}/>
          <div style={{ width:1, height:16, background:T.wBorder }}/>
          <WBtn label="✕" w={28} h={24} dim/>
        </div>
        {/* Page grid */}
        <div style={{ padding:14, display:'grid', gridTemplateColumns:'repeat(4,1fr)',
          gap:10, maxHeight:380, overflowY:'auto' }}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <div key={n} style={{
              borderRadius:6, overflow:'hidden',
              border: n===2 ? `1.5px solid ${accentColor}` : `1px solid ${T.wBorder}`,
              background:T.wBg,
              boxShadow: n===2 ? `0 0 0 2px ${accentColor}30` : 'none',
            }}>
              <div style={{ height:88, position:'relative', background:'#fff', overflow:'hidden' }}>
                <CanvasDots opacity={0.10} spacing={14}/>
                {n===2 && (
                  <div style={{ position:'absolute', top:6, right:6, width:18, height:18,
                    borderRadius:'50%', background:accentColor,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>✓</span>
                  </div>
                )}
              </div>
              <div style={{ padding:'5px 7px 8px', background:T.wPanel }}>
                <div style={{ fontFamily:T.win, fontSize:11, fontWeight:600, color:T.wFg, marginBottom:4 }}>
                  Pg {n}
                </div>
                <div style={{ display:'flex', gap:3 }}>
                  {['Copy','Paste ↓','✕'].map((a,i) => (
                    <div key={a} style={{
                      flex:1, textAlign:'center', padding:'3px 0', borderRadius:4,
                      background:T.wHover, border:`1px solid ${T.wBorder}`,
                      fontFamily:T.win, fontSize:10,
                      color: a==='✕' ? '#ff6060' : T.wFgDim,
                      cursor:'pointer',
                    }}>{a}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Page bar */}
    <div style={{ height:32, background:T.wSurface, borderTop:`1px solid ${T.wBorder}`,
      display:'flex', alignItems:'center', padding:'0 10px', gap:6, flexShrink:0, opacity:0.35 }}>
      <span style={{ fontFamily:T.win, fontSize:11, color:T.wFgDimmer }}>Page bar…</span>
    </div>
  </WinFrame>
);

Object.assign(window, {
  WBtn, WDivider, RibbonGroup, RibbonTool, WinSwatches, WinSizeDots, WinNBCard,
  WinHiCanvas, WinHiHome, WinHiPageManager, WIN_NOTEBOOKS,
});
