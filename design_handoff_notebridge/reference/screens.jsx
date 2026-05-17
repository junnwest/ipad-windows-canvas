// NoteBridge — Notebook library, page templates picker, connection states
const { useState: useStateAux } = React;

// ─────────────────────────────────────────────────────────────
// Notebook cover — visual element used across variations
// ─────────────────────────────────────────────────────────────
function NotebookCover({ color='#5a7058', title='Field notebook', subtitle='12 pages', width=148, height=200, accent='cloth' }) {
  return (
    <div style={{
      width, height, borderRadius:'1px 6px 6px 1px', background: color,
      position:'relative', flexShrink:0,
      boxShadow: `inset 2px 0 0 rgba(0,0,0,0.18), inset -1px 0 0 rgba(255,255,255,0.12),
                  0 1px 2px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.12)`,
      overflow:'hidden',
    }}>
      {/* spine */}
      <div style={{
        position:'absolute', left:0, top:0, bottom:0, width:10,
        background:'linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05) 50%, rgba(0,0,0,0))',
      }}/>
      {/* cloth texture */}
      {accent==='cloth' && (
        <svg width="100%" height="100%" style={{position:'absolute',inset:0,opacity:.08, mixBlendMode:'overlay'}}>
          <defs><pattern id={`cloth-${color}`} width="3" height="3" patternUnits="userSpaceOnUse">
            <path d="M0 0L3 3M3 0L0 3" stroke="white" strokeWidth="0.3"/></pattern></defs>
          <rect width="100%" height="100%" fill={`url(#cloth-${color})`}/>
        </svg>
      )}
      {/* label */}
      <div style={{
        position:'absolute', left: 20, right: 14, top: 24, bottom: 24,
        border:'0.5px solid rgba(255,255,255,0.35)',
        padding:'14px 10px', display:'flex', flexDirection:'column', justifyContent:'space-between',
      }}>
        <div>
          <div style={{
            fontFamily:'var(--font-display)', fontSize: width>120?15:13, fontWeight:600,
            color:'rgba(255,255,255,0.95)', letterSpacing:-0.2, lineHeight:1.2,
          }}>{title}</div>
          <div style={{fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:6, fontVariantNumeric:'tabular-nums'}}>{subtitle}</div>
        </div>
        <div style={{
          fontSize:9, color:'rgba(255,255,255,0.45)', fontFamily:'var(--font-mono)',
          textTransform:'uppercase', letterSpacing:.5,
        }}>NoteBridge</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Library variation A — Grid of covers (Apple Books-like)
// ─────────────────────────────────────────────────────────────
function LibraryGrid() {
  const [selected, setSelected] = useStateAux('field');
  const notebooks = [
    { id:'field',   color:'#5a7058', title:'Field notebook',  pages:12, edited:'2 hours ago' },
    { id:'meet',    color:'#4a6890', title:'Meeting notes',   pages:24, edited:'yesterday' },
    { id:'sketch',  color:'#b85544', title:'Sketchbook',      pages: 8, edited:'Monday' },
    { id:'q3',      color:'#c4a878', title:'Q3 planning',     pages:16, edited:'last week' },
    { id:'studio',  color:'#3d3936', title:'Studio',          pages:31, edited:'2 weeks ago' },
    { id:'travel',  color:'#8b6aa8', title:'Travel journal',  pages: 6, edited:'Apr 22' },
  ];

  return (
    <div style={{
      width:'100%', height:'100%', background:'var(--paper-warm)', display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      <div style={{
        height:44, display:'flex', alignItems:'center', padding:'0 18px', gap:14,
        borderBottom:'0.5px solid var(--rule)', flexShrink:0,
      }}>
        <NBStatusBar/>
        <div style={{flex:1, textAlign:'center', fontFamily:'var(--font-display)', fontSize:15, fontWeight:600}}>Library</div>
        <button style={{
          border:'none', background:'var(--ink)', color:'var(--paper)', cursor:'pointer',
          padding:'7px 12px 7px 10px', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', gap:5, fontWeight:500,
        }}><NBIc.plus/> New notebook</button>
        <NBStatusBarTrailing/>
      </div>

      <div style={{padding:'18px 24px 8px', display:'flex', alignItems:'center', gap:12}}>
        <div style={{
          flex:1, display:'flex', alignItems:'center', gap:8, padding:'7px 12px',
          background:'rgba(255,255,255,0.6)', border:'0.5px solid var(--rule)', borderRadius:8,
        }}>
          <NBIc.search style={{color:'var(--ink-mute)'}}/>
          <span style={{fontSize:13, color:'var(--ink-mute)'}}>Search 6 notebooks</span>
        </div>
        <div style={{display:'flex', gap:0, border:'0.5px solid var(--rule)', borderRadius:7, padding:2, background:'rgba(255,255,255,0.5)'}}>
          <button style={{padding:'4px 10px', border:'none', background:'var(--ink)', color:'var(--paper)', borderRadius:5, fontSize:12, cursor:'pointer'}}>Covers</button>
          <button style={{padding:'4px 10px', border:'none', background:'transparent', color:'var(--ink-soft)', fontSize:12, cursor:'pointer'}}>List</button>
        </div>
      </div>

      <div style={{
        flex:1, padding:'18px 24px 24px', overflow:'auto',
        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:'28px 22px',
      }}>
        {notebooks.map(nb => (
          <button key={nb.id} onClick={()=>setSelected(nb.id)} style={{
            background:'transparent', border:'none', cursor:'pointer', padding:0,
            display:'flex', flexDirection:'column', alignItems:'flex-start', gap:10,
          }}>
            <div style={{
              padding: 4, borderRadius: 4,
              background: selected===nb.id ? 'rgba(26,23,20,0.06)' : 'transparent',
              boxShadow: selected===nb.id ? '0 0 0 2px var(--ink)' : 'none',
              transition: 'box-shadow .15s',
            }}>
              <NotebookCover color={nb.color} title={nb.title} subtitle={`${nb.pages} pages`}/>
            </div>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:13, color:'var(--ink)', fontWeight:500, lineHeight:1.3}}>{nb.title}</div>
              <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>Edited {nb.edited}</div>
            </div>
          </button>
        ))}
        {/* New notebook tile */}
        <button style={{
          background:'transparent', border:'none', cursor:'pointer', padding:0,
          display:'flex', flexDirection:'column', alignItems:'flex-start', gap:10,
        }}>
          <div style={{
            width:148, height:200, border:'1.5px dashed var(--ink-faint)', borderRadius:'1px 6px 6px 1px',
            display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-mute)',
            background:'transparent',
          }}><NBIc.plus/></div>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>New notebook</div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Library variation B — Shelf rows (like a real bookshelf)
// ─────────────────────────────────────────────────────────────
function LibraryShelf() {
  const rows = [
    {
      title:'Active', count:3, books:[
        { color:'#5a7058', title:'Field notebook', pages:12 },
        { color:'#4a6890', title:'Meeting notes', pages:24 },
        { color:'#c4a878', title:'Q3 planning', pages:16 },
      ]
    },
    {
      title:'Sketching', count:2, books:[
        { color:'#b85544', title:'Sketchbook', pages:8 },
        { color:'#3d3936', title:'Studio', pages:31 },
      ]
    },
    {
      title:'Personal', count:1, books:[
        { color:'#8b6aa8', title:'Travel journal', pages:6 },
      ]
    },
  ];

  return (
    <div style={{width:'100%', height:'100%', background:'var(--paper-warm)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <div style={{
        height:44, display:'flex', alignItems:'center', padding:'0 18px', gap:14,
        borderBottom:'0.5px solid var(--rule)', flexShrink:0,
      }}>
        <NBStatusBar/>
        <div style={{flex:1, textAlign:'center', fontFamily:'var(--font-display)', fontSize:15, fontWeight:600}}>Library</div>
        <button style={{
          border:'none', background:'transparent', color:'var(--ink-soft)', cursor:'pointer',
          padding:'7px 11px', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', gap:5,
        }}><NBIc.plus/></button>
        <NBStatusBarTrailing/>
      </div>

      <div style={{flex:1, overflow:'auto', padding:'20px 0'}}>
        {rows.map((row, i) => (
          <div key={i} style={{marginBottom: 14}}>
            <div style={{padding:'0 24px 12px', display:'flex', alignItems:'baseline', gap:8}}>
              <div style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, letterSpacing:-0.2}}>{row.title}</div>
              <div style={{fontSize:11, color:'var(--ink-mute)'}}>{row.count} {row.count===1?'notebook':'notebooks'}</div>
            </div>
            {/* shelf */}
            <div style={{position:'relative', padding:'0 24px'}}>
              <div style={{display:'flex', gap:18, alignItems:'flex-end', paddingBottom: 14}}>
                {row.books.map((b, j) => (
                  <NotebookCover key={j} color={b.color} title={b.title} subtitle={`${b.pages} pages`} width={120} height={164}/>
                ))}
                <button style={{
                  width:120, height:164, border:'1.5px dashed var(--ink-faint)', borderRadius:'1px 6px 6px 1px',
                  background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-mute)',
                  cursor:'pointer', flexShrink:0,
                }}><NBIc.plus/></button>
              </div>
              {/* shelf line */}
              <div style={{height: 1, background:'linear-gradient(to right, transparent, var(--rule) 10%, var(--rule) 90%, transparent)'}}/>
              <div style={{height: 4, background:'linear-gradient(to bottom, rgba(0,0,0,0.04), transparent)'}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page templates picker — modal-style
// ─────────────────────────────────────────────────────────────
function TemplatePicker() {
  const [size, setSize] = useStateAux('A4');
  const [template, setTemplate] = useStateAux('dotted');
  const [color, setColor] = useStateAux('#5a7058');

  const sizes = [{id:'A4', label:'A4', dim:'210 × 297mm'}, {id:'Letter', label:'Letter', dim:'8.5 × 11in'}, {id:'Square', label:'Square', dim:'1:1'}];
  const templates = [
    {id:'blank', name:'Blank'},
    {id:'dotted', name:'Dot grid'},
    {id:'ruled', name:'Ruled'},
    {id:'squared', name:'Squared'},
    {id:'cornell', name:'Cornell'},
    {id:'three-col', name:'Three column'},
  ];
  const colors = ['#5a7058','#4a6890','#b85544','#c4a878','#3d3936','#8b6aa8'];

  return (
    <div style={{width:'100%', height:'100%', background:'rgba(26,23,20,0.25)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)'}}>
      <div style={{
        width: 580, maxHeight: 'calc(100% - 40px)', background:'var(--paper)', borderRadius: 14,
        boxShadow:'0 24px 80px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.08)',
        overflow:'hidden', display:'flex', flexDirection:'column',
      }}>
        <div style={{padding:'18px 22px 14px', borderBottom:'0.5px solid var(--rule)'}}>
          <div style={{fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, letterSpacing:-0.2}}>New notebook</div>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:2}}>Choose a paper size and template.</div>
        </div>

        <div style={{flex:1, overflow:'auto', padding: 22, display:'flex', flexDirection:'column', gap: 22}}>
          {/* Name */}
          <div>
            <div style={{fontSize:11, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8}}>Title</div>
            <div style={{
              padding:'9px 12px', background:'#fff', border:'0.5px solid var(--rule-strong)', borderRadius:7,
              fontSize:14, color:'var(--ink)', fontFamily:'var(--font-display)',
            }}>Field notebook</div>
          </div>

          {/* Cover color */}
          <div>
            <div style={{fontSize:11, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8}}>Cover</div>
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <NotebookCover color={color} title="Field notebook" subtitle="0 pages" width={86} height={116}/>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {colors.map(c => (
                  <button key={c} onClick={()=>setColor(c)} style={{
                    width:30, height:30, borderRadius:'2px 5px 5px 2px', background:c, border:'none', cursor:'pointer',
                    boxShadow: c===color
                      ? 'inset 2px 0 0 rgba(0,0,0,0.18), 0 0 0 2px var(--paper), 0 0 0 3.5px var(--ink)'
                      : 'inset 2px 0 0 rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.08)',
                  }}/>
                ))}
              </div>
            </div>
          </div>

          {/* Size */}
          <div>
            <div style={{fontSize:11, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8}}>Paper size</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8}}>
              {sizes.map(s => (
                <button key={s.id} onClick={()=>setSize(s.id)} style={{
                  padding:'10px 12px', background: size===s.id?'#fff':'transparent',
                  border: size===s.id?'1.5px solid var(--ink)':'0.5px solid var(--rule-strong)',
                  borderRadius: 8, cursor:'pointer', textAlign:'left',
                }}>
                  <div style={{fontSize:13, fontWeight:500, color:'var(--ink)'}}>{s.label}</div>
                  <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:1, fontVariantNumeric:'tabular-nums'}}>{s.dim}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <div style={{fontSize:11, fontWeight:600, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8}}>Template</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              {templates.map(t => (
                <button key={t.id} onClick={()=>setTemplate(t.id)} style={{
                  border:'none', background:'transparent', cursor:'pointer', padding: 4,
                  borderRadius: 6,
                  boxShadow: template===t.id ? '0 0 0 2px var(--ink)' : 'none',
                  display:'flex', flexDirection:'column', alignItems:'stretch', gap:6,
                }}>
                  <div style={{
                    aspectRatio:'3/4', background:'var(--paper)',
                    boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.05)',
                    position:'relative', overflow:'hidden',
                  }}>
                    <TemplateMini kind={t.id}/>
                  </div>
                  <div style={{fontSize:11, color:'var(--ink-soft)', textAlign:'center'}}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{padding:'14px 22px', borderTop:'0.5px solid var(--rule)', display:'flex', justifyContent:'flex-end', gap:8}}>
          <button style={{
            padding:'7px 14px', background:'transparent', border:'0.5px solid var(--rule-strong)', borderRadius:7,
            fontSize:13, color:'var(--ink-soft)', cursor:'pointer',
          }}>Cancel</button>
          <button style={{
            padding:'7px 16px', background:'var(--ink)', border:'none', borderRadius:7,
            fontSize:13, color:'var(--paper)', cursor:'pointer', fontWeight:500,
          }}>Create notebook</button>
        </div>
      </div>
    </div>
  );
}

function TemplateMini({ kind }) {
  if (kind === 'blank') return null;
  if (kind === 'dotted') return (
    <svg width="100%" height="100%" style={{opacity:.6}}>
      <defs><pattern id="m-dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#b8ad9a"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#m-dots)"/>
    </svg>
  );
  if (kind === 'ruled') return (
    <svg width="100%" height="100%" viewBox="0 0 60 80">
      {[12,20,28,36,44,52,60,68].map(y=><line key={y} x1="6" x2="54" y1={y} y2={y} stroke="#cbb9d4" strokeWidth=".4"/>)}
      <line x1="10" x2="10" y1="0" y2="80" stroke="#d4a8a0" strokeWidth=".4"/>
    </svg>
  );
  if (kind === 'squared') return (
    <svg width="100%" height="100%" style={{opacity:.65}}>
      <defs><pattern id="m-sq" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M7 0H0v7" fill="none" stroke="#c5b8a3" strokeWidth=".4"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#m-sq)"/>
    </svg>
  );
  if (kind === 'cornell') return (
    <svg width="100%" height="100%" viewBox="0 0 60 80">
      <line x1="18" x2="18" y1="8" y2="64" stroke="#c5b8a3" strokeWidth=".5"/>
      <line x1="4" x2="56" y1="64" y2="64" stroke="#c5b8a3" strokeWidth=".5"/>
      <line x1="4" x2="56" y1="8" y2="8" stroke="#c5b8a3" strokeWidth=".5"/>
    </svg>
  );
  if (kind === 'three-col') return (
    <svg width="100%" height="100%" viewBox="0 0 60 80">
      <line x1="22" x2="22" y1="6" y2="74" stroke="#c5b8a3" strokeWidth=".5"/>
      <line x1="40" x2="40" y1="6" y2="74" stroke="#c5b8a3" strokeWidth=".5"/>
    </svg>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────
// Pages overview grid
// ─────────────────────────────────────────────────────────────
function PagesOverview() {
  const [sel, setSel] = useStateAux(2);
  const pages = Array.from({length:12}, (_,i)=>({n:i+1, kind: i===1?'diagram': (i+1)%3===0?'meeting':'blank', template: i===1?'squared':i===3?'cornell':'dotted'}));

  return (
    <div style={{width:'100%', height:'100%', background:'var(--paper-warm)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <div style={{
        height:44, display:'flex', alignItems:'center', padding:'0 18px', gap:14,
        borderBottom:'0.5px solid var(--rule)', flexShrink:0,
      }}>
        <NBStatusBar/>
        <div style={{flex:1, display:'flex', alignItems:'baseline', justifyContent:'center', gap:8}}>
          <span style={{fontFamily:'var(--font-display)', fontSize:15, fontWeight:600}}>Field notebook</span>
          <span style={{fontSize:13, color:'var(--ink-mute)'}}>· 12 pages</span>
        </div>
        <button style={{
          border:'none', background:'transparent', color:'var(--ink-soft)', cursor:'pointer',
          padding:'6px 12px', borderRadius:8, fontSize:14, fontWeight:500,
        }}>Done</button>
        <NBStatusBarTrailing/>
      </div>

      <div style={{padding:'10px 18px 6px', display:'flex', alignItems:'center', gap:8, borderBottom:'0.5px solid var(--rule)'}}>
        <button style={{padding:'4px 10px', border:'0.5px solid var(--rule-strong)', background:'#fff', borderRadius:6, fontSize:12, cursor:'pointer', color:'var(--ink)'}}>All pages</button>
        <button style={{padding:'4px 10px', border:'none', background:'transparent', borderRadius:6, fontSize:12, cursor:'pointer', color:'var(--ink-mute)'}}>Starred</button>
        <button style={{padding:'4px 10px', border:'none', background:'transparent', borderRadius:6, fontSize:12, cursor:'pointer', color:'var(--ink-mute)'}}>Bookmarks</button>
        <div style={{flex:1}}/>
        <button style={{
          border:'none', background:'transparent', color:'var(--ink-soft)', cursor:'pointer',
          padding:'4px 8px', borderRadius:6, fontSize:12, display:'flex', alignItems:'center', gap:5,
        }}><NBIc.plus/> New page</button>
      </div>

      <div style={{
        flex:1, padding:'20px 24px 24px', overflow:'auto',
        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'22px 18px',
      }}>
        {pages.map(p => (
          <button key={p.n} onClick={()=>setSel(p.n)} style={{
            background:'transparent', border:'none', cursor:'pointer', padding:0,
            display:'flex', flexDirection:'column', gap:8, alignItems:'stretch',
          }}>
            <div style={{
              aspectRatio:'3/4', background:'var(--paper)', position:'relative', overflow:'hidden',
              boxShadow: p.n===sel
                ? '0 0 0 2px var(--ink), 0 6px 14px rgba(0,0,0,.10)'
                : '0 1px 2px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.05)',
            }}>
              <TemplateMini kind={p.template}/>
              {p.kind!=='blank' && <div style={{position:'absolute', inset:0, transform:'scale(0.22)', transformOrigin:'top left', width:'455%', height:'455%'}}><NBSampleInk variant={p.kind}/></div>}
            </div>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2px'}}>
              <span style={{fontSize:11, color: p.n===sel?'var(--ink)':'var(--ink-mute)', fontWeight: p.n===sel?600:400, fontVariantNumeric:'tabular-nums'}}>Page {p.n}</span>
              {p.n===1 && <NBIc.star style={{color:'var(--tan)', fill:'var(--tan)'}}/>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Connection states — connected, disconnected modal, discovery modal
// ─────────────────────────────────────────────────────────────
function ConnectionConnected() {
  return (
    <div style={{width:'100%', height:'100%', background:'var(--paper-warm)', display:'flex', flexDirection:'column'}}>
      <div style={{
        height:44, display:'flex', alignItems:'center', padding:'0 18px', gap:14,
        borderBottom:'0.5px solid var(--rule)',
      }}>
        <NBStatusBar/>
        <div style={{flex:1, textAlign:'center', fontFamily:'var(--font-display)', fontSize:15, fontWeight:600}}>NoteBridge</div>
        <NBStatusPill onDisconnect={()=>{}}/>
        <NBStatusBarTrailing/>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
        <div style={{
          width: 360, padding: 28, background:'#fff', borderRadius:14,
          boxShadow:'0 1px 2px rgba(0,0,0,.05), 0 10px 30px rgba(0,0,0,.06)',
          textAlign:'center',
        }}>
          <div style={{
            width:64, height:64, margin:'0 auto 20px', borderRadius:14,
            background:'var(--sage-soft)', border:'0.5px solid rgba(90,112,88,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
          }}>
            <NBIc.ipad style={{color:'var(--sage)', width:28, height:28}}/>
            <div style={{position:'absolute', bottom:-3, right:-3, width:16, height:16, borderRadius:'50%', background:'var(--sage)', border:'2.5px solid #fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div style={{fontFamily:'var(--font-display)', fontSize:17, fontWeight:600, letterSpacing:-0.2}}>Connected to Kenneth's iPad</div>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:6, lineHeight:1.45}}>
            Move your cursor off the right edge of this screen to draw on the iPad.
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:22, textAlign:'left'}}>
            <div style={{padding:'10px 12px', background:'var(--paper)', borderRadius:8}}>
              <div style={{fontSize:10.5, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, fontWeight:600}}>Latency</div>
              <div style={{fontSize:18, fontWeight:600, marginTop:2, fontVariantNumeric:'tabular-nums', fontFamily:'var(--font-display)'}}>12 <span style={{fontSize:11, color:'var(--ink-mute)'}}>ms</span></div>
            </div>
            <div style={{padding:'10px 12px', background:'var(--paper)', borderRadius:8}}>
              <div style={{fontSize:10.5, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:.5, fontWeight:600}}>Frame rate</div>
              <div style={{fontSize:18, fontWeight:600, marginTop:2, fontVariantNumeric:'tabular-nums', fontFamily:'var(--font-display)'}}>30 <span style={{fontSize:11, color:'var(--ink-mute)'}}>fps</span></div>
            </div>
          </div>

          <button style={{
            marginTop:18, padding:'8px 16px', background:'transparent', border:'0.5px solid var(--rule-strong)',
            borderRadius:7, fontSize:13, color:'var(--ink-soft)', cursor:'pointer',
          }}>Disconnect</button>
        </div>
      </div>
    </div>
  );
}

function ConnectionDiscovery() {
  return (
    <div style={{width:'100%', height:'100%', background:'var(--paper-warm)', display:'flex', flexDirection:'column'}}>
      <div style={{
        height:44, display:'flex', alignItems:'center', padding:'0 18px', gap:14,
        borderBottom:'0.5px solid var(--rule)',
      }}>
        <NBStatusBar/>
        <div style={{flex:1, textAlign:'center', fontFamily:'var(--font-display)', fontSize:15, fontWeight:600}}>NoteBridge</div>
        <div style={{
          display:'flex', alignItems:'center', gap:8, padding:'5px 10px',
          background:'rgba(74,104,144,0.10)', border:'0.5px solid rgba(74,104,144,0.25)',
          borderRadius:999, fontSize:12, color:'var(--blue)', fontWeight:500,
        }}>
          <span style={{display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--blue)', animation:'nb-pulse 1.5s ease-in-out infinite'}}/>
          Looking for iPads…
        </div>
        <NBStatusBarTrailing/>
      </div>

      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32}}>
        <div style={{width:420}}>
          <div style={{textAlign:'center', marginBottom: 28}}>
            <div style={{fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, letterSpacing:-0.3}}>Choose an iPad</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:6}}>Both devices need to be on the same WiFi network.</div>
          </div>

          <div style={{background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.05)'}}>
            {[
              {name:"Kenneth's iPad Pro", model:'13" · 2024', online:true, recent:true},
              {name:"Junn's iPad", model:'11" · 2022', online:true, recent:false},
              {name:"Studio iPad", model:'10.9" · 2023', online:false, recent:true},
            ].map((d, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                borderTop: i===0?'none':'0.5px solid var(--rule)', cursor: d.online?'pointer':'default', opacity: d.online?1:0.5,
              }}>
                <div style={{
                  width:36, height:36, borderRadius:8, background:'var(--paper-warm)',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-soft)',
                }}><NBIc.ipad/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:500, color:'var(--ink)', display:'flex', alignItems:'center', gap:6}}>
                    {d.name}
                    {d.recent && <span style={{fontSize:10, color:'var(--ink-mute)', fontWeight:400, padding:'1px 6px', background:'var(--paper-warm)', borderRadius:99}}>Recent</span>}
                  </div>
                  <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>{d.model}{!d.online?' · offline':''}</div>
                </div>
                {d.online && <NBIc.chevron dir="right" style={{color:'var(--ink-mute)'}}/>}
              </div>
            ))}
          </div>

          <div style={{marginTop: 20, display:'flex', gap:8, justifyContent:'center'}}>
            <button style={{
              padding:'7px 14px', background:'transparent', border:'0.5px solid var(--rule-strong)', borderRadius:7,
              fontSize:13, color:'var(--ink-soft)', cursor:'pointer',
            }}>Use offline</button>
            <button style={{
              padding:'7px 14px', background:'transparent', border:'0.5px solid var(--rule-strong)', borderRadius:7,
              fontSize:13, color:'var(--ink-soft)', cursor:'pointer',
            }}>Connect by IP</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes nb-pulse { 0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

Object.assign(window, {
  NotebookCover, LibraryGrid, LibraryShelf, TemplatePicker, TemplateMini, PagesOverview, ConnectionConnected, ConnectionDiscovery,
});
