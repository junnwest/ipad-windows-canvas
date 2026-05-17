// NoteBridge — Canvas editor screen
// Floating toolbar (default) | Sidebar | Dock — layout selected via Tweaks.
// Stateful: tool, color, size, page, well-open, drawing simulation.

const { useState: useCState, useEffect: useCEffect, useRef: useCRef } = React;

// Per-page sample content
const PAGE_TEMPLATES = {
  1: { template: 'dotted',   ink: 'meeting' },
  2: { template: 'squared',  ink: 'diagram' },
  3: { template: 'dotted',   ink: 'meeting' },
  4: { template: 'cornell',  ink: 'lecture' },
  5: { template: 'dotted',   ink: 'sketch'  },
  6: { template: 'ruled',    ink: 'recipe'  },
  7: { template: 'dotted',   ink: 'blank'   },
  8: { template: 'squared',  ink: 'blank'   },
  9: { template: 'dotted',   ink: 'meeting' },
  10:{ template: 'ruled',    ink: 'blank'   },
  11:{ template: 'dotted',   ink: 'blank'   },
  12:{ template: 'cornell',  ink: 'blank'   },
};

function getPageMeta(n) { return PAGE_TEMPLATES[n] || { template: 'dotted', ink: 'blank' }; }

// ─────────────────────────────────────────────────────────────
// Main canvas screen — dispatches to layout variants
// ─────────────────────────────────────────────────────────────
function CanvasScreen({ notebook, onBackToLibrary, onPagesOverview, onShare, onConnection, onSettings, onNewPage,
                       layout = 'floating', connected = true, latency = 12 }) {
  const [tool, setTool] = useCState('pen');
  const [color, setColor] = useCState(COLORS[0]);
  const [size, setSize] = useCState(2.5);
  const [page, setPage] = useCState(notebook.lastPage || 2);
  const [wellOpen, setWellOpen] = useCState(false);
  const [bookmarked, setBookmarked] = useCState({ 1: true });

  const totalPages = notebook.pages;
  const handlers = {
    notebook, totalPages, tool, setTool, color, setColor, size, setSize,
    page, setPage, wellOpen, setWellOpen, bookmarked, setBookmarked,
    onBackToLibrary, onPagesOverview, onShare, onConnection, onSettings, onNewPage,
    connected, latency,
  };

  if (layout === 'sidebar') return <SidebarLayout {...handlers}/>;
  if (layout === 'dock')    return <DockLayout {...handlers}/>;
  return <FloatingLayout {...handlers}/>;
}

// ─────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────
function NotebookTitle({ notebook, page, totalPages, size = 15 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{
        width: 8, height: 11, borderRadius: '1px 2px 2px 1px', background: notebook.color, display: 'inline-block',
        boxShadow: 'inset 1px 0 0 rgba(0,0,0,0.18)', marginRight: 4, transform: 'translateY(1px)',
      }}/>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.2, fontStyle: 'italic' }}>{notebook.title}</span>
      <span style={{ fontSize: size - 2, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>p. {page} / {totalPages}</span>
    </div>
  );
}

function IconButton({ icon, onClick, title, size = 32, danger = false }) {
  const [hover, setHover] = useCState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, borderRadius: 7, border: 'none',
        background: hover ? 'rgba(28,24,20,0.06)' : 'transparent',
        color: danger ? 'var(--red)' : 'var(--ink-soft)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s',
      }}>{icon}</button>
  );
}

function PageNavCompact({ page, total, setPage, onAdd }) {
  return (
    <>
      <IconButton icon={I.chevron('left', {})} onClick={() => setPage(Math.max(1, page - 1))} title="Previous page" size={34}/>
      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', padding: '0 8px', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        {page} <span style={{ color: 'var(--ink-faint)' }}>/ {total}</span>
      </span>
      <IconButton icon={I.chevron('right', {})} onClick={() => setPage(Math.min(total, page + 1))} title="Next page" size={34}/>
      <div style={{ width: 0.5, height: 16, background: 'var(--rule-strong)', margin: '0 2px' }}/>
      <IconButton icon={I.plus({})} onClick={onAdd} title="Add page" size={34}/>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout A — Floating glass toolbar (default)
// ─────────────────────────────────────────────────────────────
function FloatingLayout(p) {
  const meta = getPageMeta(p.page);

  return (
    <div onClick={() => p.setWellOpen(false)} style={{
      width: '100%', height: '100%', background: 'var(--canvas-bg)', position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        background: 'rgba(243,237,225,0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--rule)', flexShrink: 0, position: 'relative', zIndex: 5,
      }}>
        <StatusTime/>
        <IconButton icon={I.arrow('left', {})} onClick={p.onBackToLibrary} title="Library" size={32}/>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <NotebookTitle notebook={p.notebook} page={p.page} totalPages={p.totalPages}/>
        </div>
        <IconButton icon={I.pages({})} onClick={p.onPagesOverview} title="Pages overview"/>
        <IconButton icon={I.share({})} onClick={p.onShare} title="Share"/>
        <IconButton icon={I.bookmark(p.bookmarked[p.page] ? { style: { color: 'var(--tan)', fill: 'var(--tan)' } } : {})}
          onClick={() => p.setBookmarked({ ...p.bookmarked, [p.page]: !p.bookmarked[p.page] })} title="Bookmark"/>
        <StatusPill connected={p.connected} latency={p.latency} onClick={p.onConnection}/>
        <StatusTrailing/>
      </div>

      {/* Floating toolbar */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        background: 'rgba(252,248,240,0.86)', backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: 14, padding: 6,
        boxShadow: '0 10px 36px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <ToolBtn icon={I.undo({})} onClick={() => {}} title="Undo" size={42}/>
        <ToolBtn icon={I.redo({})} onClick={() => {}} title="Redo" size={42}/>
        <div style={{ width: 1, height: 22, background: 'var(--rule)', margin: '0 4px' }}/>
        {TOOLS.map(t => (
          <ToolBtn key={t.id} icon={I[t.id]({})} active={p.tool === t.id} onClick={() => p.setTool(t.id)} title={t.label} size={42}
            color={t.id === 'highlighter' ? p.color : t.id === 'pen' ? p.color : null}/>
        ))}
        <div style={{ width: 1, height: 22, background: 'var(--rule)', margin: '0 4px' }}/>
        <PenWell color={p.color} size={p.size} expanded={p.wellOpen}
          onToggle={() => p.setWellOpen(!p.wellOpen)}
          onColor={c => p.setColor(c)}
          onSize={s => p.setSize(s)}/>
      </div>

      {/* Paper */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '90px 24px 90px', overflow: 'hidden', position: 'relative',
      }}>
        <div className="nb-fade" key={p.page}>
          <PaperPage template={meta.template} width={600} height={620}>
            <SampleInk variant={meta.ink} viewBox="0 0 580 700"/>
          </PaperPage>
        </div>
      </div>

      {/* Bottom page nav */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(252,248,240,0.86)', backdropFilter: 'blur(20px)',
        border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: 999, padding: '4px 6px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.7)',
      }}>
        <PageNavCompact page={p.page} total={p.totalPages} setPage={p.setPage} onAdd={p.onNewPage}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout B — Sidebar workspace
// ─────────────────────────────────────────────────────────────
function SidebarLayout(p) {
  const meta = getPageMeta(p.page);
  const totalPages = p.totalPages;

  return (
    <div onClick={() => p.setWellOpen(false)} style={{
      width: '100%', height: '100%', background: 'var(--canvas-bg)', position: 'relative',
      display: 'flex', overflow: 'hidden',
    }}>
      {/* Left sidebar */}
      <div style={{
        width: 250, flexShrink: 0, background: 'rgba(243,237,225,0.55)',
        backdropFilter: 'blur(20px)', borderRight: '0.5px solid var(--rule)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
          <StatusTime/>
          <div style={{ flex: 1 }}/>
          <IconButton icon={I.arrow('left', {})} onClick={p.onBackToLibrary} title="Library" size={28}/>
        </div>

        <div style={{ padding: '4px 12px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
            background: 'rgba(255,255,255,0.7)', border: '0.5px solid var(--rule)', borderRadius: 7,
            color: 'var(--ink-mute)',
          }}>
            {I.search({})}
            <span style={{ fontSize: 12 }}>Search pages…</span>
          </div>
        </div>

        <div style={{ padding: '4px 18px 8px', fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {p.notebook.title}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
            const pm = getPageMeta(n);
            const active = n === p.page;
            return (
              <button key={n} onClick={() => p.setPage(n)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                background: active ? 'rgba(28,24,20,0.08)' : 'transparent',
                border: 'none', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{
                  width: 30, height: 40, background: 'var(--paper)', position: 'relative', overflow: 'hidden',
                  borderRadius: 1, boxShadow: active ? '0 0 0 1.5px var(--ink)' : '0 1px 2px rgba(0,0,0,0.08)',
                }}>
                  <TemplateMini kind={pm.template}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: active ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: active ? 600 : 400 }}>
                    Page {n}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'capitalize' }}>
                    {pm.ink === 'blank' ? '—' : pm.ink}
                  </div>
                </div>
                {p.bookmarked[n] && I.bookmark({ style: { color: 'var(--tan)', fill: 'var(--tan)', width: 11, height: 11 } })}
              </button>
            );
          })}
          <button onClick={p.onNewPage} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
            background: 'transparent', border: '1px dashed var(--ink-faint)', borderRadius: 7,
            color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 12, marginTop: 4,
            fontFamily: 'var(--font-ui)',
          }}>
            {I.plus({})} New page
          </button>
        </div>

        <div style={{ padding: '12px 14px', borderTop: '0.5px solid var(--rule)' }}>
          <StatusPill connected={p.connected} latency={p.latency} onClick={p.onConnection}/>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Top bar */}
        <div style={{
          height: 44, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10,
          borderBottom: '0.5px solid var(--rule)', flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <NotebookTitle notebook={p.notebook} page={p.page} totalPages={totalPages} size={15}/>
          </div>
          <IconButton icon={I.pages({})} onClick={p.onPagesOverview} title="Pages overview"/>
          <IconButton icon={I.share({})} onClick={p.onShare} title="Share"/>
          <IconButton icon={I.settings({})} onClick={p.onSettings} title="Settings"/>
          <StatusTrailing/>
        </div>

        {/* Tool strip */}
        <div onClick={e => e.stopPropagation()} style={{
          height: 52, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 2,
          borderBottom: '0.5px solid var(--rule)', background: 'rgba(252,248,240,0.55)',
          flexShrink: 0, position: 'relative', zIndex: 5,
        }}>
          <ToolBtn icon={I.undo({})} onClick={() => {}} size={40}/>
          <ToolBtn icon={I.redo({})} onClick={() => {}} size={40}/>
          <div style={{ width: 1, height: 22, background: 'var(--rule)', margin: '0 6px' }}/>
          {TOOLS.map(t => (
            <ToolBtn key={t.id} icon={I[t.id]({})} active={p.tool === t.id} onClick={() => p.setTool(t.id)} title={t.label} size={40}
              color={t.id === 'pen' || t.id === 'highlighter' ? p.color : null}/>
          ))}
          <div style={{ width: 1, height: 22, background: 'var(--rule)', margin: '0 6px' }}/>
          <PenWell color={p.color} size={p.size} expanded={p.wellOpen}
            onToggle={() => p.setWellOpen(!p.wellOpen)}
            onColor={c => p.setColor(c)} onSize={s => p.setSize(s)}/>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ textTransform: 'lowercase' }}>{p.tool}</span><span>·</span><span>{p.size}pt</span>
          </div>
        </div>

        {/* Paper area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 32px', overflow: 'hidden' }}>
          <div className="nb-fade" key={p.page}>
            <PaperPage template={meta.template} width={620} height={680}>
              <SampleInk variant={meta.ink} viewBox="0 0 580 700"/>
            </PaperPage>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout C — Bottom dock
// ─────────────────────────────────────────────────────────────
function DockLayout(p) {
  const meta = getPageMeta(p.page);

  return (
    <div onClick={() => p.setWellOpen(false)} style={{
      width: '100%', height: '100%', background: 'var(--canvas-bg)', position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Minimal top bar */}
      <div style={{
        height: 42, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
        position: 'relative', zIndex: 5,
      }}>
        <StatusTime/>
        <IconButton icon={I.arrow('left', {})} onClick={p.onBackToLibrary} title="Library" size={30}/>
        <div style={{ flex: 1 }}/>
        <IconButton icon={I.pages({})} onClick={p.onPagesOverview} title="Pages overview"/>
        <IconButton icon={I.share({})} onClick={p.onShare} title="Share"/>
        <IconButton icon={I.settings({})} onClick={p.onSettings} title="Settings"/>
        <StatusPill connected={p.connected} latency={p.latency} onClick={p.onConnection}/>
        <StatusTrailing/>
      </div>

      {/* Centered title */}
      <div style={{ padding: '14px 0 6px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, fontStyle: 'italic', letterSpacing: -0.4 }}>{p.notebook.title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 3, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5 }}>Page {p.page} of {p.totalPages}</div>
      </div>

      {/* Paper */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 24px 120px', overflow: 'hidden' }}>
        <div className="nb-fade" key={p.page}>
          <PaperPage template={meta.template} width={580} height={620}>
            <SampleInk variant={meta.ink} viewBox="0 0 580 700"/>
          </PaperPage>
        </div>
      </div>

      {/* Bottom dock — tools + page nav */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          background: 'rgba(252,248,240,0.86)', backdropFilter: 'blur(28px) saturate(180%)',
          border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: 18, padding: 6,
          boxShadow: '0 10px 36px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          {TOOLS.map(t => (
            <ToolBtn key={t.id} icon={I[t.id]({})} active={p.tool === t.id} onClick={() => p.setTool(t.id)} title={t.label} size={42}
              color={t.id === 'pen' || t.id === 'highlighter' ? p.color : null}/>
          ))}
          <div style={{ width: 1, height: 22, background: 'var(--rule)', margin: '0 6px' }}/>
          <PenWell color={p.color} size={p.size} expanded={p.wellOpen} position="top"
            onToggle={() => p.setWellOpen(!p.wellOpen)}
            onColor={c => p.setColor(c)} onSize={s => p.setSize(s)}/>
        </div>
        <div style={{
          background: 'rgba(252,248,240,0.86)', backdropFilter: 'blur(28px) saturate(180%)',
          border: '0.5px solid rgba(0,0,0,0.10)', borderRadius: 18, padding: 6,
          boxShadow: '0 10px 36px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <PageNavCompact page={p.page} total={p.totalPages} setPage={p.setPage} onAdd={p.onNewPage}/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CanvasScreen, PAGE_TEMPLATES, getPageMeta });
