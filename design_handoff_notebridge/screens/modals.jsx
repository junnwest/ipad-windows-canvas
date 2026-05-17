// NoteBridge — Modals: New notebook, Pages overview, Share, Connection
const { useState: useMState } = React;

// ─────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────
function ModalScrim({ children, onClose, align = 'center' }) {
  return (
    <div onClick={onClose} className="nb-fade" style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(28,24,20,0.28)', backdropFilter: 'blur(6px) saturate(120%)',
      WebkitBackdropFilter: 'blur(6px) saturate(120%)',
      display: 'flex', alignItems: align === 'top' ? 'flex-start' : 'center', justifyContent: 'center',
      padding: '60px 24px',
    }}>
      <div onClick={e => e.stopPropagation()} className="nb-scale-in">{children}</div>
    </div>
  );
}

function ModalPanel({ children, width = 600 }) {
  return (
    <div style={{
      width, maxHeight: 'calc(100vh - 120px)', background: 'var(--paper)', borderRadius: 16,
      boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.08)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>{children}</div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{
      padding: '20px 24px 16px', borderBottom: '0.5px solid var(--rule)',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, letterSpacing: -0.3, fontStyle: 'italic' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4, lineHeight: 1.45 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{
        width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'rgba(28,24,20,0.06)', color: 'var(--ink-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{I.close({})}</button>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 9 }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────
// New notebook / template picker
// ─────────────────────────────────────────────────────────────
function NewNotebookModal({ onClose, onCreate }) {
  const [name, setName] = useMState('Field notes');
  const [color, setColor] = useMState('#5c7058');
  const [size, setSize] = useMState('A4');
  const [template, setTemplate] = useMState('dotted');

  const sizes = [
    { id: 'A4', label: 'A4', dim: '210 × 297 mm' },
    { id: 'Letter', label: 'Letter', dim: '8.5 × 11 in' },
    { id: 'Square', label: 'Square', dim: '1 : 1' },
  ];
  const templates = [
    { id: 'blank',     name: 'Blank' },
    { id: 'dotted',    name: 'Dot grid' },
    { id: 'ruled',     name: 'Ruled' },
    { id: 'squared',   name: 'Squared' },
    { id: 'cornell',   name: 'Cornell' },
    { id: 'three-col', name: 'Three column' },
  ];

  return (
    <ModalScrim onClose={onClose}>
      <ModalPanel width={620}>
        <ModalHeader title="New notebook" subtitle="Set a name, cover, and starting template. You can change all of these later." onClose={onClose}/>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Preview + name */}
          <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            <NotebookCover color={color} title={name || 'Untitled'} subtitle="0 pages" width={96} height={128}/>
            <div style={{ flex: 1 }}>
              <FieldLabel>Title</FieldLabel>
              <input value={name} onChange={e => setName(e.target.value)} style={{
                width: '100%', padding: '10px 12px', background: '#fff', border: '0.5px solid var(--rule-strong)', borderRadius: 8,
                fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500,
                outline: 'none',
              }}/>
              <div style={{ marginTop: 14 }}>
                <FieldLabel>Cover color</FieldLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COVER_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} style={{
                      width: 28, height: 36, borderRadius: '2px 5px 5px 2px', background: c, border: 'none', cursor: 'pointer',
                      boxShadow: c === color
                        ? 'inset 2px 0 0 rgba(0,0,0,0.18), 0 0 0 2px var(--paper), 0 0 0 3.5px var(--ink)'
                        : 'inset 2px 0 0 rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.08)',
                    }}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Paper size */}
          <div>
            <FieldLabel>Paper size</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {sizes.map(s => (
                <button key={s.id} onClick={() => setSize(s.id)} style={{
                  padding: '10px 12px', background: size === s.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: size === s.id ? '1.5px solid var(--ink)' : '0.5px solid var(--rule-strong)',
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{s.dim}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <FieldLabel>Page template</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {templates.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer', padding: 5,
                  borderRadius: 6,
                  boxShadow: template === t.id ? '0 0 0 2px var(--ink)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 7,
                }}>
                  <div style={{
                    aspectRatio: '3 / 4', background: 'var(--paper)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <TemplateMini kind={t.id}/>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center' }}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '0.5px solid var(--rule)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--rule-strong)', borderRadius: 8,
            fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500,
          }}>Cancel</button>
          <button onClick={() => onCreate({ name, color, size, template })} style={{
            padding: '8px 18px', background: 'var(--ink)', border: 'none', borderRadius: 8,
            fontSize: 13, color: 'var(--paper)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
            boxShadow: '0 2px 6px rgba(28,24,20,0.18)',
          }}>Create notebook</button>
        </div>
      </ModalPanel>
    </ModalScrim>
  );
}

// ─────────────────────────────────────────────────────────────
// Pages overview
// ─────────────────────────────────────────────────────────────
function PagesOverviewModal({ notebook, currentPage, bookmarked, onClose, onSelect, onNewPage }) {
  const [filter, setFilter] = useMState('all');
  const all = Array.from({ length: notebook.pages }, (_, i) => i + 1);
  let pages = all;
  if (filter === 'bookmarked') pages = all.filter(n => bookmarked[n]);

  return (
    <ModalScrim onClose={onClose}>
      <ModalPanel width={840}>
        <ModalHeader title={notebook.title} subtitle={`${notebook.pages} pages · last edited ${notebook.edited}`} onClose={onClose}/>

        <div style={{ padding: '12px 24px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '0.5px solid var(--rule)' }}>
          {[
            { id: 'all', label: 'All pages' },
            { id: 'bookmarked', label: 'Bookmarked' },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              padding: '5px 10px', border: filter === t.id ? '0.5px solid var(--rule-strong)' : 'none',
              background: filter === t.id ? '#fff' : 'transparent', borderRadius: 6, fontSize: 12,
              cursor: 'pointer', color: filter === t.id ? 'var(--ink)' : 'var(--ink-mute)', fontFamily: 'var(--font-ui)', fontWeight: 500,
            }}>{t.label}</button>
          ))}
          <div style={{ flex: 1 }}/>
          <button onClick={onNewPage} style={{
            padding: '5px 10px', border: 'none', background: 'rgba(28,24,20,0.06)', borderRadius: 6, fontSize: 12,
            cursor: 'pointer', color: 'var(--ink)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)',
          }}>{I.plus({})} New page</button>
        </div>

        <div style={{
          flex: 1, overflow: 'auto', padding: '20px 24px 24px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '22px 18px',
        }}>
          {pages.map(n => {
            const meta = getPageMeta(n);
            const active = n === currentPage;
            return (
              <button key={n} onClick={() => onSelect(n)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch',
              }}>
                <div style={{
                  aspectRatio: '3 / 4', background: 'var(--paper)', position: 'relative', overflow: 'hidden',
                  boxShadow: active
                    ? '0 0 0 2px var(--ink), 0 6px 14px rgba(0,0,0,0.10)'
                    : '0 1px 2px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.05)',
                }}>
                  <TemplateMini kind={meta.template}/>
                  {meta.ink !== 'blank' && (
                    <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.22)', transformOrigin: 'top left', width: '455%', height: '455%' }}>
                      <SampleInk variant={meta.ink}/>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                  <span style={{ fontSize: 11.5, color: active ? 'var(--ink)' : 'var(--ink-mute)', fontWeight: active ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>Page {n}</span>
                  {bookmarked[n] && I.bookmark({ style: { color: 'var(--tan)', fill: 'var(--tan)' } })}
                </div>
              </button>
            );
          })}
        </div>
      </ModalPanel>
    </ModalScrim>
  );
}

// ─────────────────────────────────────────────────────────────
// Share / export
// ─────────────────────────────────────────────────────────────
function ShareModal({ notebook, onClose }) {
  const [scope, setScope] = useMState('notebook'); // notebook | current | range
  const [format, setFormat] = useMState('pdf');
  const [includeBg, setIncludeBg] = useMState(true);
  const [copied, setCopied] = useMState(false);

  const formats = [
    { id: 'pdf',  label: 'PDF',         desc: 'Vector, searchable text' },
    { id: 'png',  label: 'PNG',         desc: 'One image per page' },
    { id: 'note', label: 'NoteBridge',  desc: 'Editable .nbnote bundle' },
  ];

  return (
    <ModalScrim onClose={onClose}>
      <ModalPanel width={520}>
        <ModalHeader title="Share & export" subtitle={`From "${notebook.title}"`} onClose={onClose}/>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Scope */}
          <div>
            <FieldLabel>Pages</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { id: 'notebook', label: 'All pages', count: notebook.pages },
                { id: 'current',  label: 'Current',   count: 1 },
                { id: 'range',    label: 'Range…',    count: '' },
              ].map(s => (
                <button key={s.id} onClick={() => setScope(s.id)} style={{
                  padding: '9px 10px', background: scope === s.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: scope === s.id ? '1.5px solid var(--ink)' : '0.5px solid var(--rule-strong)',
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>{s.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{s.count}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <FieldLabel>Format</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {formats.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: format === f.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: format === f.id ? '1.5px solid var(--ink)' : '0.5px solid var(--rule)',
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 5, background: 'var(--paper-warm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)',
                  }}>{f.id.toUpperCase().slice(0, 3)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{f.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{f.desc}</div>
                  </div>
                  {format === f.id && <div style={{ color: 'var(--sage)' }}>{I.check({})}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <FieldLabel>Options</FieldLabel>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
              <Switch on={includeBg} onChange={setIncludeBg}/>
              <span style={{ fontSize: 13, color: 'var(--ink)' }}>Include paper template</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
              <Switch on={true} onChange={() => {}}/>
              <span style={{ fontSize: 13, color: 'var(--ink)' }}>Include bookmarks as PDF outline</span>
            </label>
          </div>

          {/* Quick share */}
          <div style={{
            padding: '12px 14px', background: 'rgba(255,255,255,0.5)', border: '0.5px solid var(--rule)', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: 'var(--ink-mute)' }}>{I.link({})}</span>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              notebridge.app/k/8f3a-{notebook.id}
            </div>
            <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }} style={{
              padding: '5px 10px', border: '0.5px solid var(--rule-strong)', background: copied ? 'var(--sage-soft)' : '#fff',
              color: copied ? 'var(--sage)' : 'var(--ink-soft)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 500,
              fontFamily: 'var(--font-ui)',
            }}>{copied ? 'Copied' : 'Copy link'}</button>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '0.5px solid var(--rule)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--rule-strong)', borderRadius: 8,
            fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
          }}>Cancel</button>
          <button onClick={onClose} style={{
            padding: '8px 18px', background: 'var(--ink)', border: 'none', borderRadius: 8,
            fontSize: 13, color: 'var(--paper)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(28,24,20,0.18)',
          }}>{I.export({})} Export</button>
        </div>
      </ModalPanel>
    </ModalScrim>
  );
}

// ─────────────────────────────────────────────────────────────
// Connection sheet — discovery + connected detail
// ─────────────────────────────────────────────────────────────
function ConnectionModal({ connected, latency, onClose, onConnect, onDisconnect }) {
  const devices = [
    { name: "Kenneth's PC",   host: 'kenneth-pc.local',  online: true,  recent: true,  here: connected },
    { name: 'Studio · Mac',   host: 'studio-mini.local', online: true,  recent: false, here: false },
    { name: 'Junn · Windows', host: 'junn-win.local',    online: false, recent: true,  here: false },
  ];

  return (
    <ModalScrim onClose={onClose}>
      <ModalPanel width={460}>
        <ModalHeader title={connected ? 'Connected' : 'Find a desktop'} subtitle={connected ? 'Your iPad is mirroring to a desktop NoteBridge window.' : 'Both devices must be on the same WiFi network.'} onClose={onClose}/>

        {connected && (
          <div style={{ padding: '20px 24px 4px' }}>
            <div style={{
              padding: 16, borderRadius: 12, background: 'var(--sage-soft)',
              border: '0.5px solid rgba(92,112,88,0.25)',
              display: 'flex', gap: 14, alignItems: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: '#fff',
                border: '0.5px solid rgba(92,112,88,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sage)', position: 'relative',
              }}>
                {I.ipad({ width: 22, height: 22 })}
                <div style={{ position: 'absolute', bottom: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: 'var(--sage)', border: '2.5px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)', fontStyle: 'italic', letterSpacing: -0.2 }}>Kenneth's PC</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>kenneth-pc.local · 192.168.1.42</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
              <Stat label="Latency" value={latency} unit="ms" trend="stable"/>
              <Stat label="Frames"  value="30"     unit="fps"/>
              <Stat label="Up"      value="04:12"  unit=""/>
            </div>

            <button onClick={onDisconnect} style={{
              width: '100%', marginTop: 14, padding: '10px', background: 'transparent',
              border: '0.5px solid var(--rule-strong)', borderRadius: 8, color: 'var(--red)',
              fontSize: 13, cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
            }}>Disconnect</button>
          </div>
        )}

        {!connected && (
          <div style={{ padding: '8px 24px 12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', marginBottom: 14,
              background: 'rgba(72,100,136,0.10)', border: '0.5px solid rgba(72,100,136,0.25)',
              borderRadius: 999, fontSize: 12, color: 'var(--blue)', fontWeight: 500, width: 'max-content',
            }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'nb-pulse 1.5s ease-in-out infinite' }}/>
              Searching local network…
            </div>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)' }}>
              {devices.map((d, i) => (
                <div key={i} onClick={() => d.online && onConnect(d)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderTop: i === 0 ? 'none' : '0.5px solid var(--rule)',
                  cursor: d.online ? 'pointer' : 'default', opacity: d.online ? 1 : 0.5,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 7, background: 'var(--paper-warm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)',
                  }}>{I.ipad({})}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {d.name}
                      {d.recent && <span style={{ fontSize: 9.5, color: 'var(--ink-mute)', fontWeight: 600, padding: '1px 6px', background: 'var(--paper-warm)', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.4 }}>Recent</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{d.host}{!d.online ? ' · offline' : ''}</div>
                  </div>
                  {d.online && <span style={{ color: 'var(--ink-mute)' }}>{I.chevron('right', {})}</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button style={{
                flex: 1, padding: '9px 12px', background: 'transparent', border: '0.5px solid var(--rule-strong)', borderRadius: 8,
                fontSize: 12.5, color: 'var(--ink-soft)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
              }}>Connect by IP…</button>
              <button onClick={onClose} style={{
                flex: 1, padding: '9px 12px', background: 'transparent', border: '0.5px solid var(--rule-strong)', borderRadius: 8,
                fontSize: 12.5, color: 'var(--ink-soft)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
              }}>Use offline</button>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 24px', borderTop: '0.5px solid var(--rule)' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            Move your cursor off the right edge of your desktop screen to draw on this iPad — exactly like a second monitor.
          </div>
        </div>
      </ModalPanel>
    </ModalScrim>
  );
}

function Stat({ label, value, unit, trend }) {
  return (
    <div style={{ padding: '8px 10px', background: '#fff', borderRadius: 8, border: '0.5px solid rgba(92,112,88,0.15)' }}>
      <div style={{ fontSize: 9.5, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>
        {value}{unit && <span style={{ fontSize: 10, color: 'var(--ink-mute)', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Switch (used in modals + settings)
// ─────────────────────────────────────────────────────────────
function Switch({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
      background: on ? 'var(--sage)' : 'rgba(28,24,20,0.18)',
      position: 'relative', transition: 'background .18s', padding: 0, flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.10)',
        transition: 'left .18s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}/>
    </button>
  );
}

Object.assign(window, { ModalScrim, ModalPanel, ModalHeader, FieldLabel, Switch, NewNotebookModal, PagesOverviewModal, ShareModal, ConnectionModal });
