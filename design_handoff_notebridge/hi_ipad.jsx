// NoteBridge Hi-Fi — iPad Screens

// ── Tool Rail (shared between canvas screens) ─────────────────────────────────
const ToolRail = ({ accentColor=T.accent, side='left' }) => {
  const toolColors = ['#1a1a1a','#d63030','#2860d0','#28a050','#df7020','#7838c0','#707070'];
  const borderSide = side==='left'
    ? { borderRight:`0.5px solid ${T.sep}` }
    : { borderLeft:`0.5px solid ${T.sep}` };
  return (
    <div style={{
      width:60, background:T.glass,
      backdropFilter:T.glassBlur, WebkitBackdropFilter:T.glassBlur,
      ...borderSide,
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'14px 0 18px', gap:0, flexShrink:0, zIndex:10,
    }}>
      {/* Tools */}
      {[
        { Icon:PenIcon,    sel:true  },
        { Icon:EraserIcon, sel:false },
        { Icon:TextIcon,   sel:false },
      ].map(({ Icon, sel }, i) => (
        <div key={i} style={{
          width:44, height:44, borderRadius:12, marginBottom:3, cursor:'pointer',
          background: sel ? `${accentColor}16` : 'transparent',
          border:     sel ? `1px solid ${accentColor}35` : '1px solid transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={21} color={sel ? accentColor : T.label}/>
        </div>
      ))}

      {/* Divider */}
      <div style={{ width:28, height:0.5, background:T.sep, margin:'10px 0' }}/>

      {/* Colors */}
      <div style={{ display:'flex', flexDirection:'column', gap:7, alignItems:'center' }}>
        {toolColors.map((c, i) => (
          <div key={i} style={{
            width: i===0?22:17, height: i===0?22:17, borderRadius:'50%', background:c, cursor:'pointer',
            ...(i===0
              ? { boxShadow:`0 0 0 2px #fff, 0 0 0 3.8px ${accentColor}`, border:'none' }
              : { border:'1.5px solid rgba(0,0,0,0.10)' })
          }}/>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width:28, height:0.5, background:T.sep, margin:'10px 0' }}/>

      {/* Sizes */}
      <div style={{ display:'flex', flexDirection:'column', gap:9, alignItems:'center' }}>
        {[3,5,8,13].map((s, i) => (
          <div key={i} style={{
            width:s, height:s, borderRadius:'50%', background:T.label,
            opacity: i===1 ? 0.82 : 0.22,
            ...(i===1 ? { outline:`2px solid ${accentColor}70`, outlineOffset:2 } : {}),
          }}/>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex:1 }}/>

      {/* Undo / Redo */}
      {[UndoIcon, RedoIcon].map((Icon, i) => (
        <div key={i} style={{ width:38, height:38, borderRadius:10,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', opacity:i===1?0.30:0.80 }}>
          <Icon size={19} color={T.label}/>
        </div>
      ))}
    </div>
  );
};

// Page navigation bar (bottom of canvas)
const PageBar = ({ accentColor=T.accent, page=2, total=8 }) => (
  <div style={{
    height:46, background:T.glass,
    backdropFilter:T.glassBlur, WebkitBackdropFilter:T.glassBlur,
    borderTop:`0.5px solid ${T.sep}`,
    display:'flex', alignItems:'center', padding:'0 18px', gap:6, flexShrink:0,
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:2, opacity:0.40 }}>
      <ChevronLeft size={18} color={accentColor}/>
    </div>
    <span style={{ fontFamily:T.ios, fontSize:14, color:T.label2, minWidth:52, textAlign:'center', userSelect:'none' }}>
      {page} of {total}
    </span>
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      <ChevronRight size={18} color={accentColor}/>
    </div>
    <div style={{ flex:1 }}/>
    <div style={{
      display:'flex', alignItems:'center', gap:6,
      background:accentColor, borderRadius:10, padding:'7px 16px',
      cursor:'pointer', boxShadow:`0 2px 10px ${accentColor}55`,
    }}>
      <PlusIcon size={14} color="#fff"/>
      <span style={{ fontFamily:T.ios, fontSize:14, fontWeight:600, color:'#fff', letterSpacing:'-0.1px' }}>
        Page
      </span>
    </div>
  </div>
);

// Canvas content hint (strokes + text)
const CanvasContent = () => (
  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
    <text x="76" y="78" fontFamily="-apple-system,'SF Pro Display',sans-serif" fontSize="22"
      fill="rgba(0,0,0,0.72)" fontWeight="600" letterSpacing="-0.4">Chapter 4: Wave Mechanics</text>
    <line x1="76" y1="88" x2="560" y2="88" stroke="rgba(0,0,0,0.10)" strokeWidth="0.8"/>
    <text x="76" y="122" fontFamily="-apple-system,'SF Pro Display',sans-serif" fontSize="15"
      fill="rgba(0,0,0,0.48)" fontWeight="400">The wave equation describes how waves propagate through space and time.</text>
    <text x="76" y="148" fontFamily="-apple-system,'SF Pro Display',sans-serif" fontSize="15"
      fill="rgba(0,0,0,0.48)">ψ(x,t) = A·sin(kx − ωt)</text>
    {/* Drawn curve */}
    <path d="M76 210 C140 170,200 250,280 200 S400 240,480 195 S580 215,640 200"
      stroke="rgba(0,0,0,0.22)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    {/* Annotation arrow */}
    <path d="M310 175 L310 160 L330 150" stroke="rgba(0,0,0,0.2)" strokeWidth="1" fill="none"/>
    <text x="333" y="148" fontFamily="-apple-system" fontSize="11" fill="rgba(0,0,0,0.35)">amplitude</text>
  </svg>
);

// ── SCREEN 1: iPad Canvas (disconnected) ─────────────────────────────────────
const IPadHiCanvas = ({ accentColor=T.accent }) => (
  <IPadFrame landscape>
    <IOSNavBar
      title="Physics Notes"
      leftItem={<div style={{display:'flex',alignItems:'center',gap:2}}>
        <ChevronLeft size={18} color={accentColor}/>
        <IOSTxtBtn label="Notebooks" color={accentColor}/>
      </div>}
      rightItems={[
        <div style={{display:'flex',alignItems:'center',gap:2,cursor:'pointer'}}>
          <PagesIcon size={19} color={accentColor}/>
          <IOSTxtBtn label="Pages" color={accentColor} style={{fontSize:15}}/>
        </div>,
        <EllipsisIcon size={20} color={accentColor}/>,
      ]}
    />
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      <ToolRail accentColor={accentColor} side="left"/>
      <div style={{ flex:1, position:'relative', background:'#fff', overflow:'hidden' }}>
        <CanvasDots/>
        <CanvasContent/>
      </div>
    </div>
    <PageBar accentColor={accentColor}/>
  </IPadFrame>
);

// ── SCREEN 2: iPad Canvas (connected — identical + pill) ─────────────────────
const IPadHiConnectedCanvas = ({ accentColor=T.accent }) => (
  <IPadFrame landscape>
    <IOSNavBar
      title="Physics Notes"
      leftItem={<div style={{display:'flex',alignItems:'center',gap:2}}>
        <ChevronLeft size={18} color={accentColor}/>
        <IOSTxtBtn label="Notebooks" color={accentColor}/>
      </div>}
      rightItems={[
        <div style={{display:'flex',alignItems:'center',gap:2,cursor:'pointer'}}>
          <PagesIcon size={19} color={accentColor}/>
          <IOSTxtBtn label="Pages" color={accentColor} style={{fontSize:15}}/>
        </div>,
        <EllipsisIcon size={20} color={accentColor}/>,
      ]}
    />
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      <ToolRail accentColor={accentColor} side="left"/>
      <div style={{ flex:1, position:'relative', background:'#fff', overflow:'hidden' }}>
        <CanvasDots/>
        <CanvasContent/>
        {/* ← The ONLY change when connected */}
        <div style={{ position:'absolute', top:14, right:14 }}>
          <HiStatusPill accentColor={accentColor}/>
        </div>
      </div>
    </div>
    <PageBar accentColor={accentColor}/>
  </IPadFrame>
);

// ── SCREEN 3: iPad Home ───────────────────────────────────────────────────────
const NOTEBOOKS = [
  { title:'Physics Notes',    pages:'24 pages', date:'Edited 2h ago',  coverIdx:0 },
  { title:'Math 202',         pages:'18 pages', date:'Yesterday',       coverIdx:1 },
  { title:'History — WW2',    pages:'31 pages', date:'Apr 20',          coverIdx:2 },
  { title:'Design System',    pages:'9 pages',  date:'Apr 19',          coverIdx:3 },
  { title:'Daily Journal',    pages:'45 pages', date:'Apr 18',          coverIdx:4 },
  { title:'Research',         pages:'12 pages', date:'Apr 15',          coverIdx:5 },
];

const IPadHiHome = ({ accentColor=T.accent }) => (
  <IPadFrame>
    {/* Large-title nav */}
    <div style={{ padding:'14px 20px 10px', background:T.bg, flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, fontFamily:T.ios, fontSize:32, fontWeight:700,
          letterSpacing:'-0.6px', color:T.label }}>Notebooks</div>
        {/* Connect to Windows */}
        <div style={{
          display:'flex', alignItems:'center', gap:7,
          background:T.fill, borderRadius:10, padding:'7px 14px',
          cursor:'pointer', border:`0.5px solid ${T.sep}`,
        }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:T.label3 }}/>
          <span style={{ fontFamily:T.ios, fontSize:13, fontWeight:500, color:T.label2 }}>
            Connect to Windows
          </span>
        </div>
        {/* New notebook */}
        <div style={{
          width:36, height:36, borderRadius:11, background:accentColor,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', boxShadow:`0 2px 10px ${accentColor}55`,
          flexShrink:0,
        }}>
          <PlusIcon size={18} color="#fff"/>
        </div>
      </div>
    </div>
    <div style={{ height:'0.5px', background:T.sep, flexShrink:0 }}/>
    {/* Grid */}
    <div style={{
      flex:1, overflowY:'auto', padding:'18px 20px 36px',
      display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignContent:'start',
    }}>
      {NOTEBOOKS.map((nb,i) => (
        <HiNotebookCard key={i} {...nb} w="100%" h={240} accentColor={accentColor} style={{width:'100%'}}/>
      ))}
    </div>
  </IPadFrame>
);

// ── SCREEN 4: Connect to Windows sheet ───────────────────────────────────────
const DEVICES = [
  { name:'DESKTOP-PC7K',  desc:'Connecting…',  connecting:true  },
  { name:'LAPTOP-HOME',   desc:'Available',    connecting:false },
  { name:'STUDIO-MAX',    desc:'Available',    connecting:false },
];

const IPadHiConnectSheet = ({ accentColor=T.accent }) => (
  <IPadFrame>
    {/* Dimmed home behind */}
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', borderRadius:22 }}>
      <div style={{ padding:'38px 20px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {NOTEBOOKS.slice(0,4).map((nb,i) => (
          <HiNotebookCard key={i} {...nb} w="100%" h={220} accentColor={accentColor} style={{width:'100%', opacity:0.55}}/>
        ))}
      </div>
    </div>
    {/* Scrim */}
    <div style={{ position:'absolute', inset:0, zIndex:1, background:'rgba(0,0,0,0.38)',
      backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)', borderRadius:22 }}/>
    {/* Sheet */}
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, zIndex:2,
      background:'rgba(252,250,248,0.98)',
      backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
      borderRadius:'20px 20px 22px 22px',
      boxShadow:T.sheet, paddingBottom:36,
    }}>
      <SheetHandle/>
      <div style={{ padding:'8px 22px 0', display:'flex', alignItems:'center' }}>
        <div style={{ fontFamily:T.ios, fontSize:20, fontWeight:700, color:T.label, letterSpacing:'-0.4px', flex:1 }}>
          Connect to Windows
        </div>
        <IOSTxtBtn label="Cancel" color={accentColor}/>
      </div>
      <div style={{ fontFamily:T.ios, fontSize:14, color:T.label2, padding:'4px 22px 16px' }}>
        Nearby desktops on your Wi-Fi network
      </div>

      {/* Device list */}
      <div style={{ margin:'0 16px', borderRadius:14, overflow:'hidden',
        border:`0.5px solid ${T.sep}`, background:'#fff' }}>
        {DEVICES.map((d, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', padding:'14px 16px', gap:14,
            borderBottom: i<DEVICES.length-1 ? `0.5px solid ${T.sep}` : 'none',
            background: i===0 ? `${accentColor}09` : 'transparent',
          }}>
            {/* Device icon */}
            <div style={{ width:42, height:36, borderRadius:6, background:T.fill,
              border:`0.5px solid ${T.sep}`, display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0 }}>
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                <rect x="1" y="1" width="20" height="13" rx="2" stroke={T.label2} strokeWidth="1.4"/>
                <path d="M7 14l-1 3h10l-1-3" stroke={T.label2} strokeWidth="1.3" strokeLinejoin="round"/>
                <line x1="6" y1="17" x2="16" y2="17" stroke={T.label2} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:T.ios, fontSize:16, fontWeight:600, color:T.label, letterSpacing:'-0.2px' }}>
                {d.name}
              </div>
              <div style={{ fontFamily:T.ios, fontSize:13, color: d.connecting ? accentColor : T.label2 }}>
                {d.desc}
              </div>
            </div>
            {d.connecting && (
              <div style={{ width:20, height:20, borderRadius:'50%',
                border:`2.5px solid ${accentColor}`, borderTopColor:'transparent',
                animation:'spin 0.8s linear infinite' }}/>
            )}
            {!d.connecting && <ChevronRight size={16} color={T.label3}/>}
          </div>
        ))}
      </div>

      <div style={{ padding:'14px 22px 0', fontFamily:T.ios, fontSize:13, color:T.label3, lineHeight:1.5 }}>
        Not seeing your PC?{' '}
        <span style={{ color:accentColor, fontWeight:500 }}>
          Open NoteBridge on Windows first.
        </span>
      </div>
    </div>
    <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
  </IPadFrame>
);

// ── SCREEN 5: Page Manager sheet ─────────────────────────────────────────────
const IPadHiPageManager = ({ accentColor=T.accent }) => (
  <IPadFrame>
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', borderRadius:22,
      background:'#fff' }}>
      <CanvasDots opacity={0.10}/>
      <CanvasContent/>
    </div>
    <div style={{ position:'absolute', inset:0, zIndex:1, background:'rgba(0,0,0,0.32)',
      backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', borderRadius:22 }}/>
    {/* Sheet */}
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, zIndex:2,
      background:'rgba(252,250,248,0.98)',
      backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
      borderRadius:'20px 20px 22px 22px',
      boxShadow:T.sheet, maxHeight:'82%', display:'flex', flexDirection:'column',
      paddingBottom:32,
    }}>
      <SheetHandle/>
      <div style={{ padding:'6px 20px 14px', display:'flex', alignItems:'center', flexShrink:0 }}>
        <div style={{ fontFamily:T.ios, fontSize:20, fontWeight:700, color:T.label, letterSpacing:'-0.3px', flex:1 }}>
          Pages
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7,
          background:accentColor, borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
          <PlusIcon size={13} color="#fff"/>
          <span style={{ fontFamily:T.ios, fontSize:14, fontWeight:600, color:'#fff' }}>Add Page</span>
        </div>
      </div>
      <div style={{ overflowY:'auto', padding:'0 16px', flex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[1,2,3,4,5,6].map(n => (
            <div key={n} style={{
              borderRadius:12, overflow:'hidden',
              border: n===2 ? `2px solid ${accentColor}` : `1px solid ${T.sep}`,
              background:'#fff', boxShadow: n===2 ? `0 0 0 3px ${accentColor}22` : T.card,
            }}>
              <div style={{ height:130, position:'relative', background:'#fff', overflow:'hidden' }}>
                <CanvasDots opacity={0.10} spacing={18}/>
                {n===2 && (
                  <div style={{ position:'absolute', top:8, right:8, width:20, height:20,
                    borderRadius:'50%', background:accentColor,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>
                  </div>
                )}
              </div>
              <div style={{ padding:'8px 10px 10px', background:T.groupBg }}>
                <div style={{ fontFamily:T.ios, fontSize:13, fontWeight:600, color:T.label, marginBottom:6 }}>
                  Page {n}
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  {['Copy','Paste ↓','Delete'].map((a,i) => (
                    <div key={a} style={{
                      flex:1, textAlign:'center', padding:'4px 0', borderRadius:7,
                      background:'#fff', border:`0.5px solid ${T.sep}`,
                      fontFamily:T.ios, fontSize:11, fontWeight:500,
                      color: a==='Delete' ? '#ff3b30' : T.label2,
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
  </IPadFrame>
);

// ── SCREEN 6: Notebook Setup sheet ───────────────────────────────────────────
const PAGE_SIZES = ['A4 Land.','A4 Port.','Letter Land.','Letter Port.','Square'];
const TEMPLATES  = ['Blank','Dotted','Squared','Ruled','Cornell','3-Column'];

const IPadHiNotebookSetup = ({ accentColor=T.accent }) => (
  <IPadFrame>
    <div style={{ position:'absolute', inset:0, zIndex:0, background:T.groupBg, borderRadius:22 }}/>
    <div style={{ position:'absolute', inset:0, zIndex:1, background:'rgba(0,0,0,0.28)',
      backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', borderRadius:22 }}/>
    {/* Sheet */}
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, zIndex:2,
      background:'rgba(252,250,248,0.99)',
      backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
      borderRadius:'20px 20px 22px 22px',
      boxShadow:T.sheet, display:'flex', flexDirection:'column', paddingBottom:34,
    }}>
      <SheetHandle/>
      <div style={{ padding:'6px 22px 0', display:'flex', alignItems:'center', flexShrink:0 }}>
        <div style={{ fontFamily:T.ios, fontSize:20, fontWeight:700, color:T.label, letterSpacing:'-0.3px', flex:1 }}>
          New Notebook
        </div>
        <IOSTxtBtn label="Create" color={accentColor} bold/>
      </div>

      <div style={{ overflowY:'auto', padding:'18px 22px', flex:1, display:'flex', flexDirection:'column', gap:22 }}>
        {/* Name field */}
        <div>
          <div style={{ fontFamily:T.ios, fontSize:13, fontWeight:600, color:T.label2, textTransform:'uppercase',
            letterSpacing:'0.4px', marginBottom:8 }}>Name</div>
          <div style={{ background:'#fff', borderRadius:12, border:`1.5px solid ${accentColor}`,
            padding:'12px 16px', boxShadow:`0 0 0 3px ${accentColor}18` }}>
            <span style={{ fontFamily:T.ios, fontSize:17, color:T.label3 }}>Untitled Notebook</span>
          </div>
        </div>

        {/* Page size */}
        <div>
          <div style={{ fontFamily:T.ios, fontSize:13, fontWeight:600, color:T.label2, textTransform:'uppercase',
            letterSpacing:'0.4px', marginBottom:8 }}>Page Size</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {PAGE_SIZES.map((s,i) => (
              <div key={s} style={{
                padding:'7px 14px', borderRadius:10,
                background: i===0 ? `${accentColor}14` : '#fff',
                border: i===0 ? `1.5px solid ${accentColor}` : `1px solid ${T.sep}`,
                fontFamily:T.ios, fontSize:14, fontWeight: i===0 ? 600 : 400,
                color: i===0 ? accentColor : T.label2, cursor:'pointer',
              }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Template */}
        <div>
          <div style={{ fontFamily:T.ios, fontSize:13, fontWeight:600, color:T.label2, textTransform:'uppercase',
            letterSpacing:'0.4px', marginBottom:8 }}>Template</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {TEMPLATES.map((t,i) => (
              <div key={t} style={{
                borderRadius:12, overflow:'hidden',
                border: i===1 ? `1.5px solid ${accentColor}` : `1px solid ${T.sep}`,
                background:'#fff',
                boxShadow: i===1 ? `0 0 0 3px ${accentColor}18` : T.card,
              }}>
                {/* Template preview */}
                <div style={{ height:68, background: i===1 ? `${accentColor}09` : T.fill,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="52" height="48" viewBox="0 0 52 48" fill="none">
                    <rect x="1" y="1" width="50" height="46" rx="3" fill="white"
                      stroke={i===1?accentColor:T.sep} strokeWidth={i===1?1.5:1}/>
                    {i===1 && [8,16,24,32,40].map(y=>
                      [8,18,28,38].map(x=>
                        <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill={accentColor} opacity="0.5"/>
                      )
                    )}
                    {i===2 && [8,16,24,32,40].map(y=>
                      <React.Fragment key={y}>
                        <line x1="6" y1={y} x2="46" y2={y} stroke={T.sep} strokeWidth="0.7"/>
                        {[6,16,26,36,46].map(x=><line key={x} x1={x} y1="4" x2={x} y2="44" stroke={T.sep} strokeWidth="0.7"/>)}
                      </React.Fragment>
                    )}
                    {(i===3||i===0) && i===3 && [10,18,26,34,42].map(y=>
                      <line key={y} x1="6" y1={y} x2="46" y2={y} stroke={T.sep} strokeWidth="0.8"/>
                    )}
                  </svg>
                </div>
                <div style={{ padding:'6px 0 8px', textAlign:'center',
                  fontFamily:T.ios, fontSize:13, fontWeight: i===1 ? 600 : 400,
                  color: i===1 ? accentColor : T.label2 }}>
                  {t}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </IPadFrame>
);

Object.assign(window, {
  ToolRail, PageBar, CanvasContent,
  IPadHiCanvas, IPadHiConnectedCanvas,
  IPadHiHome,
  IPadHiConnectSheet,
  IPadHiPageManager,
  IPadHiNotebookSetup,
  NOTEBOOKS,
});
