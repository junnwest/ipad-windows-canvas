// NoteBridge — Library screen (home)
// Browse notebooks. Grid or shelf view (Tweak).

const { useState: useLState } = React;

function LibraryScreen({ data, onOpen, onNewNotebook, onSettings, onConnection, layout = 'grid', connected = true, latency = 12 }) {
  const [query, setQuery] = useLState('');
  const [activeMenu, setActiveMenu] = useLState(null);
  const [view, setView] = useLState(layout);

  const notebooks = data.filter(n => !query || n.title.toLowerCase().includes(query.toLowerCase()));
  const recent = notebooks.slice(0, 3);

  return (
    <div onClick={() => setActiveMenu(null)} style={{
      width: '100%', height: '100%', background: 'var(--paper-warm)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    }}>
      {/* Top bar */}
      <div style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 14,
        flexShrink: 0, position: 'relative', zIndex: 2,
      }}>
        <StatusTime/>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '0.5px solid var(--rule-strong)', borderRadius: 8, padding: 2, background: 'rgba(255,255,255,0.5)' }}>
          <button onClick={() => setView('grid')} style={{
            padding: '4px 8px', border: 'none', background: view === 'grid' ? 'var(--ink)' : 'transparent',
            color: view === 'grid' ? 'var(--paper)' : 'var(--ink-soft)', borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500,
          }}>{I.grid({ width: 13, height: 13 })} Covers</button>
          <button onClick={() => setView('shelf')} style={{
            padding: '4px 8px', border: 'none', background: view === 'shelf' ? 'var(--ink)' : 'transparent',
            color: view === 'shelf' ? 'var(--paper)' : 'var(--ink-soft)', borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500,
          }}>{I.list({ width: 13, height: 13 })} Shelves</button>
        </div>
        <StatusPill connected={connected} latency={latency} onClick={onConnection}/>
        <button onClick={onSettings} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
          color: 'var(--ink-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{I.settings({})}</button>
        <StatusTrailing/>
      </div>

      {/* Hero header */}
      <div style={{ padding: '12px 36px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 500,
              letterSpacing: -1.2, lineHeight: 1.05, color: 'var(--ink)', fontStyle: 'italic',
            }}>Library</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>
              {notebooks.length} notebooks · last edited 2 hours ago
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: 'rgba(255,255,255,0.7)', border: '0.5px solid var(--rule-strong)', borderRadius: 9, width: 240,
            }}>
              {I.search({ style: { color: 'var(--ink-mute)' } })}
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search notebooks…"
                style={{
                  border: 'none', outline: 'none', background: 'transparent', flex: 1,
                  fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-ui)',
                }}/>
            </div>
            <button onClick={onNewNotebook} style={{
              padding: '8px 14px 8px 10px', background: 'var(--ink)', color: 'var(--paper)', border: 'none',
              borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
              fontFamily: 'var(--font-ui)',
              boxShadow: '0 1px 2px rgba(28,24,20,0.18), 0 4px 12px rgba(28,24,20,0.12)',
            }}>{I.plus({})} New notebook</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: view === 'grid' ? '4px 36px 36px' : '4px 0 36px' }}>
        {view === 'grid' ? (
          <GridView notebooks={notebooks} recent={recent} onOpen={onOpen} onNewNotebook={onNewNotebook}
            activeMenu={activeMenu} setActiveMenu={setActiveMenu}/>
        ) : (
          <ShelfView notebooks={notebooks} onOpen={onOpen} onNewNotebook={onNewNotebook}/>
        )}
      </div>
    </div>
  );
}

function GridView({ notebooks, recent, onOpen, onNewNotebook, activeMenu, setActiveMenu }) {
  return (
    <>
      {/* Recent strip */}
      {recent.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>Recent</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>this week</div>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {recent.map(nb => (
              <button key={nb.id} onClick={() => onOpen(nb.id)} style={{
                background: 'rgba(255,255,255,0.5)', border: '0.5px solid var(--rule)', borderRadius: 10, padding: 12,
                cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center', flex: '1 1 0', minWidth: 0, textAlign: 'left',
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <NotebookCover color={nb.color} title={nb.title} subtitle={`${nb.pages} pp`} width={56} height={76}/>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)', fontStyle: 'italic', letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nb.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nb.edited}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{nb.pages} pages</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18, whiteSpace: 'nowrap' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>All notebooks</div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{notebooks.length}</div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '32px 26px',
      }}>
        {notebooks.map(nb => (
          <NotebookTile key={nb.id} nb={nb} onOpen={() => onOpen(nb.id)}
            menuOpen={activeMenu === nb.id} onMenu={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === nb.id ? null : nb.id); }}/>
        ))}
        <button onClick={onNewNotebook} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{
            width: 152, height: 200, border: '1.5px dashed var(--ink-faint)', borderRadius: '1px 6px 6px 1px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)',
            background: 'rgba(255,255,255,0.3)',
          }}>{I.plus({ width: 22, height: 22 })}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>New notebook</div>
        </button>
      </div>
    </>
  );
}

function NotebookTile({ nb, onOpen, menuOpen, onMenu }) {
  const [hover, setHover] = useLState(false);
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button onClick={onOpen} style={{
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
        width: '100%', textAlign: 'left',
      }}>
        <div style={{
          padding: 4, borderRadius: 4,
          transform: hover ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'transform .2s ease, box-shadow .2s',
        }}>
          <NotebookCover color={nb.color} title={nb.title} subtitle={`${nb.pages} pages`}/>
        </div>
        <div>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.1 }}>{nb.title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{nb.edited}</div>
        </div>
      </button>

      {/* Menu trigger */}
      <button onClick={onMenu} style={{
        position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 6,
        border: 'none', background: hover || menuOpen ? 'rgba(28,24,20,0.6)' : 'transparent',
        color: hover || menuOpen ? '#fff' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)', transition: 'all .15s',
      }}>{I.ellipsis({ width: 16, height: 16 })}</button>

      {menuOpen && (
        <div onClick={e => e.stopPropagation()} className="nb-scale-in" style={{
          position: 'absolute', top: 40, right: 8, zIndex: 20,
          background: 'rgba(252,248,240,0.96)', backdropFilter: 'blur(20px) saturate(180%)',
          border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: 10, padding: 4, width: 180,
          boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04)',
        }}>
          <MenuItem icon={I.pencil({})}>Rename</MenuItem>
          <MenuItem icon={I.duplicate({})}>Duplicate</MenuItem>
          <MenuItem icon={I.palette({})}>Change cover</MenuItem>
          <MenuItem icon={I.star({})}>Add to favorites</MenuItem>
          <MenuItem icon={I.export({})}>Export PDF</MenuItem>
          <div style={{ height: 0.5, background: 'var(--rule)', margin: '4px 8px' }}/>
          <MenuItem icon={I.trash({})} danger>Move to trash</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, children, danger, onClick, shortcut }) {
  const [hover, setHover] = useLState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
        border: 'none', background: hover ? (danger ? 'rgba(179,80,64,0.10)' : 'rgba(28,24,20,0.06)') : 'transparent',
        color: danger ? 'var(--red)' : 'var(--ink)', cursor: 'pointer', borderRadius: 6,
        fontSize: 13, textAlign: 'left', fontFamily: 'var(--font-ui)',
      }}>
      <span style={{ color: danger ? 'var(--red)' : 'var(--ink-mute)', display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {shortcut && <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{shortcut}</span>}
    </button>
  );
}

function ShelfView({ notebooks, onOpen, onNewNotebook }) {
  const groups = [
    { title: 'Active', subtitle: 'In rotation', books: notebooks.filter(n => ['field', 'meet', 'q3'].includes(n.id)) },
    { title: 'Sketching', subtitle: 'Visual notebooks', books: notebooks.filter(n => ['sketch', 'studio'].includes(n.id)) },
    { title: 'Personal', subtitle: 'Journals & travel', books: notebooks.filter(n => ['travel', 'recipes'].includes(n.id)) },
  ].filter(g => g.books.length > 0);

  return (
    <>
      {groups.map((g, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div style={{ padding: '0 36px 14px', display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, letterSpacing: -0.2, fontStyle: 'italic' }}>{g.title}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{g.subtitle}</div>
            <div style={{ flex: 1 }}/>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>{g.books.length} {g.books.length === 1 ? 'notebook' : 'notebooks'}</div>
          </div>
          <div style={{ position: 'relative', padding: '0 36px' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', paddingBottom: 16, overflow: 'auto' }}>
              {g.books.map(nb => (
                <button key={nb.id} onClick={() => onOpen(nb.id)} style={{
                  border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flexShrink: 0,
                  transition: 'transform .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <NotebookCover color={nb.color} title={nb.title} subtitle={`${nb.pages} pages`} width={128} height={172}/>
                </button>
              ))}
              {i === groups.length - 1 && (
                <button onClick={onNewNotebook} style={{
                  width: 128, height: 172, border: '1.5px dashed var(--ink-faint)', borderRadius: '1px 6px 6px 1px',
                  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink-mute)', cursor: 'pointer', flexShrink: 0,
                }}>{I.plus({ width: 18, height: 18 })}</button>
              )}
            </div>
            {/* Shelf line */}
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--rule-strong) 4%, var(--rule-strong) 96%, transparent)' }}/>
            <div style={{ height: 4, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), transparent)' }}/>
          </div>
        </div>
      ))}
    </>
  );
}

Object.assign(window, { LibraryScreen });
