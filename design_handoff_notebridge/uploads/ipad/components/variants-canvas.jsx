// NoteBridge — three variations of the main canvas window
// All Apple-styled. All interactive. Different layouts.

const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────
function NBPenWell({ color, size, expanded, onToggle, onColor, onSize }) {
  return (
    <div style={{ position:'relative' }}>
      <button onClick={onToggle} style={{
        display:'flex', alignItems:'center', gap:6, padding:'6px 10px 6px 8px',
        background: expanded ? 'rgba(26,23,20,0.06)' : 'transparent',
        border:'none', borderRadius:9, cursor:'pointer', height:40,
      }}>
        <span style={{
          width:14, height:14, borderRadius:'50%', background: color,
          boxShadow:'inset 0 0 0 1.5px rgba(255,255,255,0.6), 0 0 0 0.5px rgba(0,0,0,0.2)'
        }}/>
        <span style={{
          width: 16, height: size*1.2, borderRadius: size, background: color, opacity:.85
        }}/>
        <NBIc.chevron dir="down" style={{color:'var(--ink-mute)'}}/>
      </button>
      {expanded && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:20,
          background:'rgba(252,250,246,0.96)', backdropFilter:'blur(20px) saturate(180%)',
          border:'0.5px solid rgba(0,0,0,0.12)', borderRadius:14, padding:14, width:228,
          boxShadow:'0 12px 36px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.04)',
        }}>
          <div style={{fontSize:11, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8}}>Color</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:6, marginBottom:14}}>
            {NB_COLORS.map(c => (
              <button key={c} onClick={()=>onColor(c)} style={{
                width:20, height:20, borderRadius:'50%', background:c, border:'none', cursor:'pointer',
                boxShadow: c===color
                  ? '0 0 0 2px var(--paper), 0 0 0 3.5px var(--ink)'
                  : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
              }}/>
            ))}
          </div>
          <div style={{fontSize:11, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8}}>Size</div>
          <div style={{display:'flex', alignItems:'center', gap:10, justifyContent:'space-between'}}>
            {NB_SIZES.map(s => (
              <button key={s} onClick={()=>onSize(s)} style={{
                width:32, height:32, borderRadius:8, border:'none', cursor:'pointer',
                background: s===size ? 'rgba(26,23,20,0.08)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{width: s*1.5, height: s*1.5, borderRadius:'50%', background: color}}/>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NBStatusPill({ connected=true, latency=12, deviceName="Kenneth's iPad", onDisconnect }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8, padding:'5px 8px 5px 10px',
      background: connected ? 'rgba(90,112,88,0.10)' : 'rgba(184,84,68,0.10)',
      border: connected ? '0.5px solid rgba(90,112,88,0.25)' : '0.5px solid rgba(184,84,68,0.25)',
      borderRadius: 999, fontSize: 12, color: connected ? 'var(--sage)' : 'var(--red)',
      fontVariantNumeric:'tabular-nums', fontWeight: 500,
    }}>
      <NBIc.ipad style={{color: connected ? 'var(--sage)' : 'var(--red)', width:13, height:13}}/>
      <span style={{color:'var(--ink-soft)'}}>{deviceName}</span>
      <span style={{width:5, height:5, borderRadius:'50%', background: connected ? 'var(--sage)' : 'var(--red)'}}/>
      <span>{connected ? `${latency} ms` : 'offline'}</span>
      {connected && onDisconnect && (
        <button onClick={onDisconnect} style={{
          marginLeft:2, border:'none', background:'transparent', color:'var(--ink-mute)',
          cursor:'pointer', padding:'0 4px', borderRadius:4, fontSize:11,
        }}>×</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Variation A — Floating glass toolbar, full-bleed paper
// ─────────────────────────────────────────────────────────────
function VariantFloating({ initialTool='pen', initialPage=2 }) {
  const [tool, setTool] = useState(initialTool);
  const [color, setColor] = useState(NB_COLORS[0]);
  const [size, setSize] = useState(3);
  const [page, setPage] = useState(initialPage);
  const [wellOpen, setWellOpen] = useState(false);
  const totalPages = 12;

  const pageContent = page===1 ? 'meeting' : page===2 ? 'diagram' : page===3 ? 'meeting' : 'blank';
  const pageTemplate = page===2 ? 'squared' : page===4 ? 'cornell' : 'dotted';

  return (
    <div style={{
      width: '100%', height: '100%', background: 'var(--paper-warm)', position:'relative',
      display:'flex', flexDirection:'column', overflow:'hidden',
    }} onClick={()=>setWellOpen(false)}>

      {/* iOS top bar — status + title + connection */}
      <div style={{
        height: 44, display:'flex', alignItems:'center', padding:'0 18px', gap:14,
        background:'rgba(244,239,230,0.7)', backdropFilter:'blur(20px)',
        borderBottom:'0.5px solid var(--rule)', flexShrink:0, position:'relative', zIndex:2,
      }}>
        <NBStatusBar/>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
          <span style={{
            fontFamily:'var(--font-display)', fontSize:15, fontWeight:600,
            color:'var(--ink)', letterSpacing:-0.2,
          }}>Field notebook</span>
          <span style={{fontSize:13, color:'var(--ink-mute)'}}>· {page} of {totalPages}</span>
        </div>
        <NBStatusPill onDisconnect={()=>{}}/>
        <NBStatusBarTrailing/>
      </div>

      {/* Floating toolbar */}
      <div onClick={e=>e.stopPropagation()} style={{
        position:'absolute', top:62, left:'50%', transform:'translateX(-50%)', zIndex:10,
        background:'rgba(252,250,246,0.85)', backdropFilter:'blur(28px) saturate(180%)',
        border:'0.5px solid rgba(0,0,0,0.10)', borderRadius:14, padding:6,
        boxShadow:'0 8px 32px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.03)',
        display:'flex', alignItems:'center', gap:2,
      }}>
        <NBToolBtn icon={<NBIc.undo/>} onClick={()=>{}} title="Undo" size={44}/>
        <NBToolBtn icon={<NBIc.redo/>} onClick={()=>{}} title="Redo" size={44}/>
        <div style={{width:1, height:24, background:'var(--rule)', margin:'0 4px'}}/>
        {NB_TOOLS.map(t => (
          <NBToolBtn key={t.id} icon={NBIc[t.id]({})} active={tool===t.id} onClick={()=>setTool(t.id)} title={t.label} size={44}/>
        ))}
        <div style={{width:1, height:24, background:'var(--rule)', margin:'0 4px'}}/>
        <NBPenWell color={color} size={size} expanded={wellOpen}
          onToggle={()=>setWellOpen(!wellOpen)}
          onColor={c=>{setColor(c); setWellOpen(false);}}
          onSize={s=>{setSize(s); setWellOpen(false);}}/>
      </div>

      {/* Paper */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'90px 24px 80px',
        overflow:'hidden',
      }}>
        <NBPaperPage template={pageTemplate} width={600} height={620}>
          <NBSampleInk variant={pageContent}/>
        </NBPaperPage>
      </div>

      {/* Bottom page nav */}
      <div style={{
        position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)',
        display:'flex', alignItems:'center', gap:4,
        background:'rgba(252,250,246,0.85)', backdropFilter:'blur(20px)',
        border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:999, padding:'5px 8px',
        boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
      }}>
        <button onClick={()=>setPage(Math.max(1,page-1))} style={{
          width:32, height:32, border:'none', background:'transparent', cursor:'pointer',
          borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--ink-soft)',
        }}><NBIc.chevron dir="left"/></button>
        <span style={{fontSize:13, color:'var(--ink-soft)', padding:'0 8px', fontVariantNumeric:'tabular-nums'}}>{page} / {totalPages}</span>
        <button onClick={()=>setPage(Math.min(totalPages,page+1))} style={{
          width:32, height:32, border:'none', background:'transparent', cursor:'pointer',
          borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--ink-soft)',
        }}><NBIc.chevron dir="right"/></button>
        <div style={{width:0.5, height:18, background:'var(--rule)', margin:'0 4px'}}/>
        <button style={{
          width:32, height:32, border:'none', background:'transparent', cursor:'pointer',
          borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--ink-soft)',
        }}><NBIc.plus/></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Variation B — Sidebar workspace (notebook tree + page thumbnails)
// ─────────────────────────────────────────────────────────────
function VariantSidebar({ initialTool='pen', initialPage=2 }) {
  const [tool, setTool] = useState(initialTool);
  const [color, setColor] = useState(NB_COLORS[0]);
  const [size, setSize] = useState(3);
  const [page, setPage] = useState(initialPage);
  const [wellOpen, setWellOpen] = useState(false);
  const [selectedNb, setSelectedNb] = useState('field');
  const totalPages = 12;

  const notebooks = [
    { id:'field', name:'Field notebook', pages: 12, color:'#5a7058' },
    { id:'mr', name:'Meeting notes', pages: 24, color:'#4a6890' },
    { id:'sketch', name:'Sketchbook', pages: 8, color:'#b85544' },
    { id:'q3', name:'Q3 planning', pages: 16, color:'#c4a878' },
  ];

  return (
    <div style={{
      width:'100%', height:'100%', background:'var(--paper-warm)', position:'relative',
      display:'flex', overflow:'hidden',
    }} onClick={()=>setWellOpen(false)}>

      {/* Sidebar */}
      <div style={{
        width:260, flexShrink:0, background:'rgba(244,239,230,0.5)',
        backdropFilter:'blur(20px)', borderRight:'0.5px solid var(--rule)',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{height:44, display:'flex', alignItems:'center', padding:'0 18px', gap:10}}>
          <NBStatusBar/>
        </div>

        <div style={{padding:'4px 8px 8px'}}>
          <div style={{
            display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
            background:'rgba(255,255,255,0.6)', border:'0.5px solid var(--rule)',
            borderRadius:7, color:'var(--ink-mute)',
          }}>
            <NBIc.search/>
            <span style={{fontSize:12}}>Search notebooks</span>
          </div>
        </div>

        <div style={{padding:'12px 14px 6px', fontSize:10.5, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.6}}>Notebooks</div>

        <div style={{display:'flex', flexDirection:'column', padding:'0 6px'}}>
          {notebooks.map(nb => (
            <button key={nb.id} onClick={()=>setSelectedNb(nb.id)} style={{
              display:'flex', alignItems:'center', gap:9, padding:'6px 10px',
              background: selectedNb===nb.id ? 'rgba(26,23,20,0.07)' : 'transparent',
              border:'none', borderRadius:6, cursor:'pointer', textAlign:'left',
            }}>
              <div style={{
                width:14, height:18, borderRadius:'1px 3px 3px 1px', background:nb.color,
                boxShadow:'inset 1px 0 0 rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.08)',
                flexShrink:0,
              }}/>
              <span style={{fontSize:13, color:'var(--ink)', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{nb.name}</span>
              <span style={{fontSize:11, color:'var(--ink-faint)', fontVariantNumeric:'tabular-nums'}}>{nb.pages}</span>
            </button>
          ))}
        </div>

        <div style={{padding:'14px 14px 6px', fontSize:10.5, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.6}}>Recent pages</div>
        <div style={{padding:'0 14px', fontSize:12, color:'var(--ink-soft)', display:'flex', flexDirection:'column', gap:3}}>
          <div style={{padding:'3px 0'}}>Q3 planning sync</div>
          <div style={{padding:'3px 0'}}>System architecture</div>
          <div style={{padding:'3px 0'}}>Studio sketches</div>
        </div>

        <div style={{flex:1}}/>

        <div style={{padding:'12px 14px', borderTop:'0.5px solid var(--rule)'}}>
          <NBStatusPill onDisconnect={()=>{}}/>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1, display:'flex', flexDirection:'column', position:'relative'}}>
        {/* Top bar */}
        <div style={{
          height:44, display:'flex', alignItems:'center', padding:'0 18px', gap:12,
          borderBottom:'0.5px solid var(--rule)',
        }}>
          <div style={{flex:1, display:'flex', alignItems:'baseline', gap:8}}>
            <span style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, letterSpacing:-0.2}}>Field notebook</span>
            <span style={{fontSize:13, color:'var(--ink-mute)'}}>· Page {page} of {totalPages}</span>
          </div>
          <button onClick={()=>{}} style={{
            border:'none', background:'transparent', color:'var(--ink-soft)', cursor:'pointer',
            padding:'6px 10px', display:'flex', alignItems:'center', gap:6, borderRadius:8, fontSize:13,
          }}><NBIc.pages/></button>
          <button style={{
            border:'none', background:'transparent', color:'var(--ink-soft)', cursor:'pointer',
            padding:'6px 10px', display:'flex', alignItems:'center', gap:6, borderRadius:8, fontSize:13,
          }}><NBIc.share/> Export</button>
          <NBStatusBarTrailing/>
        </div>

        {/* Tool strip */}
        <div onClick={e=>e.stopPropagation()} style={{
          height:56, display:'flex', alignItems:'center', padding:'0 14px', gap:2,
          borderBottom:'0.5px solid var(--rule)', background:'rgba(250,247,242,0.6)',
        }}>
          <NBToolBtn icon={<NBIc.undo/>} onClick={()=>{}} size={44}/>
          <NBToolBtn icon={<NBIc.redo/>} onClick={()=>{}} size={44}/>
          <div style={{width:1, height:24, background:'var(--rule)', margin:'0 6px'}}/>
          {NB_TOOLS.map(t => (
            <NBToolBtn key={t.id} icon={NBIc[t.id]({})} active={tool===t.id} onClick={()=>setTool(t.id)} title={t.label} size={44}/>
          ))}
          <div style={{width:1, height:24, background:'var(--rule)', margin:'0 6px'}}/>
          <NBPenWell color={color} size={size} expanded={wellOpen}
            onToggle={()=>setWellOpen(!wellOpen)}
            onColor={c=>{setColor(c); setWellOpen(false);}}
            onSize={s=>{setSize(s); setWellOpen(false);}}/>
          <div style={{flex:1}}/>
          <div style={{display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--ink-mute)'}}>
            <span style={{fontFamily:'var(--font-mono)'}}>{tool}</span>
            <span>·</span>
            <span style={{fontFamily:'var(--font-mono)'}}>{size}pt</span>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
          <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 32px', background:'var(--paper-warm)'}}>
            <NBPaperPage template={page===2?'squared':'dotted'} width={580} height={660}>
              <NBSampleInk variant={page===1?'meeting':page===2?'diagram':'meeting'}/>
            </NBPaperPage>
          </div>

          {/* Right page rail */}
          <div style={{
            width:128, background:'rgba(244,239,230,0.5)', borderLeft:'0.5px solid var(--rule)',
            overflow:'auto', padding:'14px 12px', display:'flex', flexDirection:'column', gap:12,
          }}>
            {Array.from({length:8}, (_,i)=>i+1).map(p => (
              <button key={p} onClick={()=>setPage(p)} style={{
                border:'none', cursor:'pointer', padding:0, background:'transparent',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}>
                <div style={{
                  width:100, height:128, background:'var(--paper)',
                  borderRadius:2,
                  boxShadow: p===page
                    ? '0 0 0 2px var(--ink), 0 4px 10px rgba(0,0,0,0.10)'
                    : '0 1px 2px rgba(0,0,0,.06), 0 4px 10px rgba(0,0,0,.04)',
                  overflow:'hidden', position:'relative',
                }}>
                  <NBSampleInk variant={p===2?'diagram':p%3===0?'meeting':'blank'}/>
                </div>
                <span style={{fontSize:11, color: p===page?'var(--ink)':'var(--ink-mute)', fontWeight: p===page?600:400, fontVariantNumeric:'tabular-nums'}}>{p}</span>
              </button>
            ))}
            <button style={{
              border:'1.5px dashed var(--ink-faint)', cursor:'pointer',
              background:'transparent', borderRadius:2, width:100, height:128,
              display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-mute)',
            }}><NBIc.plus/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Variation C — Dock-based (tools at bottom, big paper)
// ─────────────────────────────────────────────────────────────
function VariantDock({ initialTool='pen', initialPage=1 }) {
  const [tool, setTool] = useState(initialTool);
  const [color, setColor] = useState(NB_COLORS[0]);
  const [size, setSize] = useState(3);
  const [page, setPage] = useState(initialPage);
  const [wellOpen, setWellOpen] = useState(false);
  const totalPages = 12;

  return (
    <div style={{
      width:'100%', height:'100%', background:'var(--paper-warm)', position:'relative',
      display:'flex', flexDirection:'column', overflow:'hidden',
    }} onClick={()=>setWellOpen(false)}>

      {/* Title bar */}
      <div style={{
        height: 40, display:'flex', alignItems:'center', padding:'0 18px', gap:14, flexShrink:0,
        position:'relative', zIndex:2,
      }}>
        <NBStatusBar/>
        <div style={{flex:1}}/>
        <button style={{
          border:'none', background:'transparent', color:'var(--ink-soft)', cursor:'pointer',
          padding:'6px 10px', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', gap:6,
        }}><NBIc.pages/></button>
        <button style={{
          border:'none', background:'transparent', color:'var(--ink-soft)', cursor:'pointer',
          padding:'6px 10px', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', gap:6,
        }}><NBIc.share/></button>
        <NBStatusPill onDisconnect={()=>{}}/>
        <NBStatusBarTrailing/>
      </div>

      {/* Title display */}
      <div style={{padding:'12px 0 4px', textAlign:'center'}}>
        <div style={{fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, letterSpacing:-0.3}}>Field notebook</div>
        <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2, fontVariantNumeric:'tabular-nums'}}>{page} / {totalPages}</div>
      </div>

      {/* Paper */}
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'4px 24px 120px', overflow:'hidden'}}>
        <NBPaperPage template="ruled" width={560} height={620}>
          <NBSampleInk variant="meeting"/>
        </NBPaperPage>
      </div>

      {/* Bottom dock */}
      <div onClick={e=>e.stopPropagation()} style={{
        position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', zIndex:10,
        display:'flex', alignItems:'center', gap:8,
      }}>
        {/* Tool dock */}
        <div style={{
          background:'rgba(252,250,246,0.86)', backdropFilter:'blur(28px) saturate(180%)',
          border:'0.5px solid rgba(0,0,0,0.10)', borderRadius:18, padding:6,
          boxShadow:'0 10px 36px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.03)',
          display:'flex', alignItems:'center', gap:2,
        }}>
          {NB_TOOLS.map(t => (
            <NBToolBtn key={t.id} icon={NBIc[t.id]({})} active={tool===t.id} onClick={()=>setTool(t.id)} title={t.label} size={42}/>
          ))}
          <div style={{width:1, height:22, background:'var(--rule)', margin:'0 6px'}}/>
          <NBPenWell color={color} size={size} expanded={wellOpen}
            onToggle={()=>setWellOpen(!wellOpen)}
            onColor={c=>{setColor(c); setWellOpen(false);}}
            onSize={s=>{setSize(s); setWellOpen(false);}}/>
        </div>

        {/* Page nav */}
        <div style={{
          background:'rgba(252,250,246,0.86)', backdropFilter:'blur(28px) saturate(180%)',
          border:'0.5px solid rgba(0,0,0,0.10)', borderRadius:18, padding:6,
          boxShadow:'0 10px 36px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.03)',
          display:'flex', alignItems:'center', gap:2,
        }}>
          <NBToolBtn icon={<NBIc.chevron dir="left"/>} onClick={()=>setPage(Math.max(1,page-1))} size={42}/>
          <NBToolBtn icon={<NBIc.chevron dir="right"/>} onClick={()=>setPage(Math.min(totalPages,page+1))} size={42}/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VariantFloating, VariantSidebar, VariantDock, NBPenWell, NBStatusPill });
