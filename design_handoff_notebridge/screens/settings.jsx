// NoteBridge — Settings screen
// Sectioned list, restrained, paper aesthetic.

const { useState: useSState } = React;

const SETTINGS_SECTIONS = [
  { id: 'connection', label: 'Connection', icon: I.wifi },
  { id: 'pencil',     label: 'Apple Pencil', icon: I.pencil },
  { id: 'paper',      label: 'Paper & ink',  icon: I.palette },
  { id: 'sync',       label: 'Sync & backup', icon: I.cloud },
  { id: 'shortcuts',  label: 'Shortcuts',    icon: I.list },
  { id: 'about',      label: 'About',        icon: I.info },
];

function SettingsScreen({ onClose, connected = true, latency = 12 }) {
  const [section, setSection] = useSState('connection');

  return (
    <div style={{
      width: '100%', height: '100%', background: 'var(--paper-warm)', display: 'flex', overflow: 'hidden',
    }}>
      {/* Left rail */}
      <div style={{
        width: 240, flexShrink: 0, background: 'rgba(235,226,209,0.4)',
        borderRight: '0.5px solid var(--rule)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
          <StatusTime/>
        </div>
        <div style={{ padding: '6px 22px 18px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, letterSpacing: -0.6, fontStyle: 'italic' }}>Settings</div>
        </div>

        <div style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SETTINGS_SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              background: section === s.id ? 'rgba(28,24,20,0.07)' : 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              color: section === s.id ? 'var(--ink)' : 'var(--ink-soft)',
              fontSize: 13.5, fontWeight: section === s.id ? 500 : 400, fontFamily: 'var(--font-ui)',
            }}>
              <span style={{ color: section === s.id ? 'var(--ink)' : 'var(--ink-mute)', display: 'flex' }}>{s.icon({})}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: '0.5px solid var(--rule)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', letterSpacing: 0.4 }}>
            NoteBridge · v1.0.2
          </div>
        </div>
      </div>

      {/* Right content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          height: 48, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 22px', gap: 14, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: '6px 14px', background: 'var(--ink)', color: 'var(--paper)', border: 'none',
            borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}>Done</button>
          <StatusTrailing/>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 56px 48px' }}>
          {section === 'connection' && <ConnectionSettings connected={connected} latency={latency}/>}
          {section === 'pencil' && <PencilSettings/>}
          {section === 'paper' && <PaperSettings/>}
          {section === 'sync' && <SyncSettings/>}
          {section === 'shortcuts' && <ShortcutsSettings/>}
          {section === 'about' && <AboutSettings/>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings primitives
// ─────────────────────────────────────────────────────────────
function SectionTitle({ children, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, letterSpacing: -0.5, fontStyle: 'italic' }}>{children}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4, lineHeight: 1.5, maxWidth: 540 }}>{subtitle}</div>}
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {title && (
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, padding: '0 4px' }}>
          {title}
        </div>
      )}
      <div style={{
        background: '#fff', borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 0.5px 0 rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        border: '0.5px solid var(--rule)',
      }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, title, subtitle, control, last, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
      borderBottom: last ? 'none' : '0.5px solid var(--rule)', cursor: onClick ? 'pointer' : 'default',
    }}>
      {icon && (
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: 'var(--paper-warm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)', flexShrink: 0,
        }}>{icon}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{control}</div>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(28,24,20,0.06)', borderRadius: 7, padding: 2 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '5px 12px', border: 'none', cursor: 'pointer', borderRadius: 5,
          background: value === o.id ? '#fff' : 'transparent', boxShadow: value === o.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
          fontSize: 12, fontWeight: 500, color: value === o.id ? 'var(--ink)' : 'var(--ink-mute)', fontFamily: 'var(--font-ui)',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function Slider({ value, onChange, min = 0, max = 1, step = 0.01, width = 180, format }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width, accentColor: 'var(--sage)' }}/>
      <span style={{ fontSize: 11.5, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'right' }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Connection
// ─────────────────────────────────────────────────────────────
function ConnectionSettings({ connected, latency }) {
  const [autoConnect, setAuto] = useSState(true);
  const [discoveryOn, setDisc] = useSState(true);
  const [cursorEntry, setCursor] = useSState('right');
  return (
    <>
      <SectionTitle subtitle="Pair this iPad with a desktop NoteBridge window. Drawing, tools, and pages stay in sync.">Connection</SectionTitle>

      {/* Live status card */}
      <div style={{
        padding: 20, background: connected ? 'var(--sage-soft)' : 'rgba(255,255,255,0.6)',
        border: connected ? '0.5px solid rgba(92,112,88,0.25)' : '0.5px solid var(--rule)',
        borderRadius: 12, marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: connected ? 'var(--sage)' : 'var(--ink-mute)',
          position: 'relative', flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          {I.ipad({ width: 26, height: 26 })}
          {connected && (
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: 'var(--sage)', border: '2.5px solid var(--paper-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5l2 2 3-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)', fontStyle: 'italic', letterSpacing: -0.2 }}>
            {connected ? "Connected to Kenneth's PC" : 'Offline · no desktop paired'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {connected ? `192.168.1.42 · port 8080 · ${latency} ms round-trip` : 'Tap Discover to find a desktop on your WiFi'}
          </div>
        </div>
        <button style={{
          padding: '8px 14px', background: connected ? 'transparent' : 'var(--ink)', color: connected ? 'var(--red)' : 'var(--paper)',
          border: connected ? '0.5px solid var(--rule-strong)' : 'none', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
        }}>{connected ? 'Disconnect' : 'Discover'}</button>
      </div>

      <SettingsGroup title="Discovery">
        <SettingsRow icon={I.wifi({})} title="Find devices on WiFi"
          subtitle="Use Bonjour / mDNS to locate desktops broadcasting NoteBridge"
          control={<Switch on={discoveryOn} onChange={setDisc}/>}/>
        <SettingsRow icon={I.ipad({})} title="Auto-connect to last device"
          subtitle="Reconnect to Kenneth's PC when both are on the same network"
          control={<Switch on={autoConnect} onChange={setAuto}/>}
          last/>
      </SettingsGroup>

      <SettingsGroup title="Cursor handoff">
        <SettingsRow icon={I.arrow('right', {})} title="Edge to enter iPad"
          subtitle="Cursor moves off this edge of your desktop and appears on the iPad"
          control={<SegmentedControl value={cursorEntry} onChange={setCursor}
            options={[{id:'right',label:'Right'},{id:'left',label:'Left'},{id:'top',label:'Top'}]}/>}
          last/>
      </SettingsGroup>

      <SettingsGroup title="Network">
        <SettingsRow title="WebSocket port" subtitle="Both devices use the same port"
          control={<code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', background: 'var(--paper-warm)', padding: '3px 8px', borderRadius: 5 }}>8080</code>}/>
        <SettingsRow title="Service name" subtitle="Advertised over Bonjour"
          control={<code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', background: 'var(--paper-warm)', padding: '3px 8px', borderRadius: 5 }}>_ipadcanvas._tcp</code>}/>
        <SettingsRow title="Connect by IP…" subtitle="Use this when discovery doesn't find the desktop"
          control={<span style={{ color: 'var(--ink-mute)' }}>{I.chevron('right',{})}</span>}
          onClick={() => {}} last/>
      </SettingsGroup>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Pencil
// ─────────────────────────────────────────────────────────────
function PencilSettings() {
  const [pressure, setPressure] = useSState(0.75);
  const [palmReject, setPalm] = useSState(true);
  const [tilt, setTilt] = useSState(true);
  const [doubleTap, setDtap] = useSState('eraser');
  const [predict, setPredict] = useSState(true);

  return (
    <>
      <SectionTitle subtitle="Fine-tune how your Apple Pencil writes, erases, and switches tools.">Apple Pencil</SectionTitle>

      <SettingsGroup title="Strokes">
        <SettingsRow icon={I.pencil({})} title="Pressure sensitivity"
          subtitle="Heavier pressure produces thicker, darker strokes"
          control={<Slider value={pressure} onChange={setPressure} format={v => `${Math.round(v*100)}%`}/>}/>
        <SettingsRow icon={I.hand({})} title="Palm rejection"
          subtitle="Ignore touches from your hand while writing"
          control={<Switch on={palmReject} onChange={setPalm}/>}/>
        <SettingsRow icon={I.shape({})} title="Tilt for shading"
          subtitle="Tilt the pencil to widen highlighter and pencil strokes"
          control={<Switch on={tilt} onChange={setTilt}/>} last/>
      </SettingsGroup>

      <SettingsGroup title="Gestures">
        <SettingsRow icon={I.duplicate({})} title="Double-tap action"
          subtitle="Tap the side of your Pencil to switch tools"
          control={<SegmentedControl value={doubleTap} onChange={setDtap}
            options={[{id:'eraser',label:'Eraser'},{id:'last',label:'Last'},{id:'off',label:'Off'}]}/>}
          last/>
      </SettingsGroup>

      <SettingsGroup title="Latency">
        <SettingsRow icon={I.wifi({})} title="Client-side prediction"
          subtitle="Draw a local preview stroke instantly, then replace with the streamed frame"
          control={<Switch on={predict} onChange={setPredict}/>} last/>
      </SettingsGroup>

      {/* Live preview */}
      <SettingsGroup title="Preview">
        <div style={{ padding: 20, background: '#fff' }}>
          <div style={{
            height: 80, background: 'var(--paper)', borderRadius: 6, position: 'relative', overflow: 'hidden',
            boxShadow: 'inset 0 0 0 0.5px var(--rule)',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 600 80">
              <path d="M30 50 Q80 20, 130 50 T230 50 T330 50 T430 50 T530 50"
                stroke="#1c1814" fill="none" strokeLinecap="round"
                strokeWidth={2 + pressure * 4}/>
              <path d="M30 50 Q80 20, 130 50 T230 50 T330 50 T430 50 T530 50"
                stroke="#1c1814" fill="none" strokeLinecap="round" opacity={pressure * 0.4}
                strokeWidth={1 + pressure * 2}/>
            </svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 8, fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
            Pen · {Math.round(pressure * 100)}% pressure
          </div>
        </div>
      </SettingsGroup>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Paper & ink
// ─────────────────────────────────────────────────────────────
function PaperSettings() {
  const [tone, setTone] = useSState('warm');
  const [defaultTemplate, setTemplate] = useSState('dotted');
  const [smoothing, setSmoothing] = useSState(0.6);
  const [paperShadow, setShadow] = useSState(true);
  const [grain, setGrain] = useSState(true);

  const tones = [
    { id: 'warm',   name: 'Warm cream',  color: '#faf6ee' },
    { id: 'paper',  name: 'Off-white',   color: '#fcfaf4' },
    { id: 'cool',   name: 'Cool ivory',  color: '#f6f6f3' },
    { id: 'dark',   name: 'Walnut',      color: '#2a2520' },
  ];

  return (
    <>
      <SectionTitle subtitle="Set the default look of every new page. Each notebook can override these.">Paper & ink</SectionTitle>

      <SettingsGroup title="Paper tone">
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {tones.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)} style={{
              padding: 6, background: 'transparent', border: 'none', cursor: 'pointer',
              borderRadius: 8, boxShadow: tone === t.id ? '0 0 0 2px var(--ink)' : 'none',
            }}>
              <div style={{ aspectRatio: '4 / 3', background: t.color, borderRadius: 4, boxShadow: 'inset 0 0 0 0.5px var(--rule-strong), 0 1px 2px rgba(0,0,0,0.05)' }}/>
              <div style={{ fontSize: 11.5, color: 'var(--ink), --ink', marginTop: 6, textAlign: 'center', fontWeight: tone === t.id ? 600 : 400 }}>{t.name}</div>
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Default page">
        <SettingsRow icon={I.grid({})} title="Template for new pages"
          subtitle="Used when adding a page mid-notebook"
          control={<SegmentedControl value={defaultTemplate} onChange={setTemplate}
            options={[{id:'blank',label:'Blank'},{id:'dotted',label:'Dot'},{id:'ruled',label:'Ruled'},{id:'squared',label:'Squared'}]}/>}/>
        <SettingsRow icon={I.palette({})} title="Show paper shadow"
          subtitle="Lift the page off the canvas with a soft drop shadow"
          control={<Switch on={paperShadow} onChange={setShadow}/>}/>
        <SettingsRow icon={I.palette({})} title="Paper grain"
          subtitle="Subtle paper texture overlay"
          control={<Switch on={grain} onChange={setGrain}/>} last/>
      </SettingsGroup>

      <SettingsGroup title="Ink">
        <SettingsRow icon={I.pen({})} title="Stroke smoothing"
          subtitle="Higher values polish wobbly strokes — lower preserves character"
          control={<Slider value={smoothing} onChange={setSmoothing} format={v => `${Math.round(v*100)}%`}/>} last/>
      </SettingsGroup>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Sync
// ─────────────────────────────────────────────────────────────
function SyncSettings() {
  return (
    <>
      <SectionTitle subtitle="Notebooks live on your desktop. Your iPad can keep an offline cache.">Sync & backup</SectionTitle>

      <SettingsGroup title="Account">
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'var(--sage)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)',
          }}>K</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Kenneth Yang</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>kenneth@notebridge.local</div>
          </div>
          <button style={{
            padding: '6px 12px', background: 'transparent', border: '0.5px solid var(--rule-strong)', borderRadius: 7,
            fontSize: 12.5, color: 'var(--ink-soft)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
          }}>Manage</button>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Offline storage">
        <SettingsRow icon={I.cloud({})} title="Cache notebooks on this iPad"
          subtitle="6 notebooks · 127 pages · 14.8 MB"
          control={<Switch on={true} onChange={() => {}}/>}/>
        <SettingsRow icon={I.duplicate({})} title="Automatic backups"
          subtitle="Daily snapshot to Files / iCloud Drive"
          control={<Switch on={true} onChange={() => {}}/>}/>
        <SettingsRow icon={I.trash({})} title="Clear local cache"
          subtitle="Erase offline copies — notebooks remain on your desktop"
          control={<button style={{
            padding: '5px 10px', background: 'rgba(179,80,64,0.08)', color: 'var(--red)',
            border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-ui)',
          }}>Clear</button>} last/>
      </SettingsGroup>

      <SettingsGroup title="Recent sync">
        <SettingsRow title="Last full sync" subtitle="Just now · 6 notebooks · OK"
          control={<span style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>OK</span>}/>
        <SettingsRow title="Sync log"
          control={<span style={{ color: 'var(--ink-mute)' }}>{I.chevron('right',{})}</span>}
          onClick={() => {}} last/>
      </SettingsGroup>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Shortcuts
// ─────────────────────────────────────────────────────────────
function ShortcutsSettings() {
  const groups = [
    { title: 'Tools', items: [
      ['Pen',          'P'],
      ['Highlighter',  'H'],
      ['Eraser',       'E'],
      ['Lasso',        'L'],
      ['Text',         'T'],
    ]},
    { title: 'Editing', items: [
      ['Undo',         '⌘ Z'],
      ['Redo',         '⌘ ⇧ Z'],
      ['Duplicate',    '⌘ D'],
      ['Select all',   '⌘ A'],
      ['Delete',       '⌫'],
    ]},
    { title: 'Navigation', items: [
      ['Next page',     '→'],
      ['Previous page', '←'],
      ['Pages overview','⌘ P'],
      ['Library',       '⌘ ⇧ L'],
      ['Search',        '⌘ F'],
    ]},
    { title: 'Connection', items: [
      ['Connect / Discover', '⌘ K'],
      ['Toggle cursor handoff', '⌥ ⌘ M'],
      ['Show this iPad on desktop', '⌘ ⇧ I'],
    ]},
  ];

  return (
    <>
      <SectionTitle subtitle="Keyboard shortcuts when a hardware keyboard or Magic Keyboard is attached.">Shortcuts</SectionTitle>
      {groups.map(g => (
        <SettingsGroup key={g.title} title={g.title}>
          {g.items.map((it, i) => (
            <SettingsRow key={it[0]} title={it[0]}
              control={
                <div style={{ display: 'flex', gap: 4 }}>
                  {it[1].split(' ').map((k, j) => (
                    <span key={j} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                      color: 'var(--ink-soft)', background: 'var(--paper-warm)',
                      border: '0.5px solid var(--rule-strong)', borderRadius: 5,
                      minWidth: 22, height: 22, padding: '0 6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 0 var(--rule-strong)',
                    }}>{k}</span>
                  ))}
                </div>
              }
              last={i === g.items.length - 1}/>
          ))}
        </SettingsGroup>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: About
// ─────────────────────────────────────────────────────────────
function AboutSettings() {
  return (
    <>
      <SectionTitle subtitle="A paper-feeling notebook that pairs with your desktop. Local-first. Offline-capable.">About NoteBridge</SectionTitle>

      <div style={{
        padding: 24, background: '#fff', borderRadius: 12, border: '0.5px solid var(--rule)',
        marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center',
      }}>
        <NotebookCover color="#5c7058" title="NoteBridge" subtitle="v1.0.2" width={80} height={108}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: -0.3, fontStyle: 'italic' }}>NoteBridge</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
            A real second-screen for your desktop. Same canvas on both ends — the iPad app feels like an iPad app, the Windows app feels like a Windows app.
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <code style={{
              padding: '3px 8px', background: 'var(--paper-warm)', borderRadius: 5,
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)',
            }}>v1.0.2 · build 412</code>
            <code style={{
              padding: '3px 8px', background: 'var(--sage-soft)', borderRadius: 5,
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sage)',
            }}>up to date</code>
          </div>
        </div>
      </div>

      <SettingsGroup title="Links">
        <SettingsRow icon={I.info({})} title="What's new in 1.0.2"
          subtitle="Hidden-window resize, pressure-preserving touch bridge, eraser sync fixes"
          control={<span style={{ color: 'var(--ink-mute)' }}>{I.chevron('right',{})}</span>} onClick={() => {}}/>
        <SettingsRow icon={I.bell({})} title="Release notes"
          control={<span style={{ color: 'var(--ink-mute)' }}>{I.chevron('right',{})}</span>} onClick={() => {}}/>
        <SettingsRow icon={I.lock({})} title="Privacy & data"
          subtitle="Everything stays on your local network unless you export"
          control={<span style={{ color: 'var(--ink-mute)' }}>{I.chevron('right',{})}</span>} onClick={() => {}}/>
        <SettingsRow icon={I.share({})} title="Send feedback"
          control={<span style={{ color: 'var(--ink-mute)' }}>{I.chevron('right',{})}</span>} onClick={() => {}} last/>
      </SettingsGroup>

      <div style={{ padding: '0 4px', fontSize: 11.5, color: 'var(--ink-faint)', lineHeight: 1.6 }}>
        Made with care · Type set in Newsreader & Geist · Paper renders best at 100% scale.
      </div>
    </>
  );
}

Object.assign(window, { SettingsScreen });
