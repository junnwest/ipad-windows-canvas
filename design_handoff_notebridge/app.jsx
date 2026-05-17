// NoteBridge — main app
// Stateful router across Library → Canvas → Settings + modals.
// Wrapped in an iPad bezel for hi-fi presentation.

const { useState: useAState, useEffect: useAEffect, useMemo: useAMemo } = React;

// ─────────────────────────────────────────────────────────────
// iPad bezel — 11" landscape, 1180×820 logical points
// ─────────────────────────────────────────────────────────────
const SCREEN_W = 1180;
const SCREEN_H = 820;
const BEZEL = 22;
const FRAME_W = SCREEN_W + BEZEL * 2;
const FRAME_H = SCREEN_H + BEZEL * 2;

function IPad({ children }) {
  return (
    <div style={{
      width: FRAME_W, height: FRAME_H, borderRadius: 38, padding: BEZEL,
      background: 'linear-gradient(135deg, #2a2724 0%, #1a1815 100%)',
      boxShadow:
        'inset 0 0 0 0.5px rgba(255,255,255,0.07), ' +
        'inset 0 0 0 1.5px rgba(0,0,0,0.4), ' +
        '0 40px 80px rgba(0,0,0,0.4), 0 12px 24px rgba(0,0,0,0.18)',
      position: 'relative',
    }}>
      {/* front camera centered on top edge (landscape) */}
      <div style={{
        position: 'absolute', top: 9, left: '50%', transform: 'translateX(-50%)',
        width: 6, height: 6, borderRadius: '50%', background: '#0a0a0c',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.18), 0 0 6px rgba(0,0,0,0.4)',
      }}/>
      <div style={{
        width: SCREEN_W, height: SCREEN_H, borderRadius: 20, overflow: 'hidden',
        background: 'var(--paper)', position: 'relative',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5)',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notebook seed data
// ─────────────────────────────────────────────────────────────
const SEED_NOTEBOOKS = [
  { id: 'field',   color: '#5c7058', title: 'Field notes',     pages: 12, edited: '2 hours ago',   lastPage: 2 },
  { id: 'meet',    color: '#486488', title: 'Meeting notes',   pages: 24, edited: 'Yesterday',     lastPage: 5 },
  { id: 'sketch',  color: '#b35040', title: 'Sketchbook',      pages: 18, edited: 'Monday',        lastPage: 5 },
  { id: 'q3',      color: '#b89868', title: 'Q3 planning',     pages: 16, edited: 'Last week',     lastPage: 1 },
  { id: 'studio',  color: '#3d3936', title: 'Studio',          pages: 31, edited: '2 weeks ago',   lastPage: 5 },
  { id: 'travel',  color: '#8c6aa6', title: 'Travel journal',  pages: 8,  edited: 'Apr 22',        lastPage: 1 },
  { id: 'recipes', color: '#a86a4a', title: 'Recipe book',     pages: 22, edited: 'Apr 10',        lastPage: 6 },
];

// ─────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────
const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "layout": "floating",
  "frame": true,
  "connected": true,
  "accentName": "sage"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULT_TWEAKS);

  // App-level state
  const [view, setView] = useAState('library'); // library | canvas | settings
  const [notebookId, setNotebookId] = useAState(null);
  const [modal, setModal] = useAState(null); // 'new' | 'pages' | 'share' | 'connection'
  const [notebooks, setNotebooks] = useAState(SEED_NOTEBOOKS);
  const [connected, setConnected] = useAState(tweaks.connected);
  const [latency, setLatency] = useAState(12);

  // Sync connected state from Tweaks
  useAEffect(() => { setConnected(tweaks.connected); }, [tweaks.connected]);

  // Live latency jitter when connected
  useAEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setLatency(prev => Math.max(8, Math.min(22, prev + (Math.random() - 0.5) * 4))), 1400);
    return () => clearInterval(id);
  }, [connected]);

  const notebook = useAMemo(() => notebooks.find(n => n.id === notebookId), [notebooks, notebookId]);

  // Actions
  const openNotebook = (id) => { setNotebookId(id); setView('canvas'); };
  const goLibrary = () => { setView('library'); };
  const openSettings = () => setView('settings');
  const closeSettings = () => setView(notebookId ? 'canvas' : 'library');

  const createNotebook = ({ name, color }) => {
    const id = 'nb-' + Date.now();
    const nb = { id, color, title: name, pages: 1, edited: 'Just now', lastPage: 1 };
    setNotebooks([nb, ...notebooks]);
    setModal(null);
    openNotebook(id);
  };

  const addPage = () => {
    if (!notebook) return;
    setNotebooks(notebooks.map(n => n.id === notebook.id ? { ...n, pages: n.pages + 1, edited: 'Just now' } : n));
  };

  // Bookmarks (kept here so they persist across modals/screens)
  const [bookmarked, setBookmarked] = useAState({ field: { 1: true } });
  const setNotebookBookmarks = (bm) => setBookmarked({ ...bookmarked, [notebookId]: bm });
  const currentBookmarks = bookmarked[notebookId] || {};

  // Hidden but persisted page state per notebook
  const [pages, setPages] = useAState({});

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background:
        'radial-gradient(1400px 800px at 30% 20%, #393530 0%, #1f1c19 60%, #15130f 100%)',
      padding: '24px 16px', overflow: 'auto', boxSizing: 'border-box',
    }}>
      <div style={{
        transform: tweaks.frame ? 'none' : 'none',
        transformOrigin: 'center',
      }}>
        {tweaks.frame ? (
          <IPad>
            <Screens
              view={view} modal={modal}
              notebook={notebook} notebooks={notebooks}
              openNotebook={openNotebook} goLibrary={goLibrary}
              openSettings={openSettings} closeSettings={closeSettings}
              setModal={setModal} createNotebook={createNotebook} addPage={addPage}
              connected={connected} latency={Math.round(latency)} setConnected={setConnected}
              bookmarked={currentBookmarks} setBookmarked={setNotebookBookmarks}
              tweaks={tweaks}
            />
          </IPad>
        ) : (
          <div style={{
            width: SCREEN_W, height: SCREEN_H, borderRadius: 4, overflow: 'hidden', position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', background: 'var(--paper)',
          }}>
            <Screens
              view={view} modal={modal}
              notebook={notebook} notebooks={notebooks}
              openNotebook={openNotebook} goLibrary={goLibrary}
              openSettings={openSettings} closeSettings={closeSettings}
              setModal={setModal} createNotebook={createNotebook} addPage={addPage}
              connected={connected} latency={Math.round(latency)} setConnected={setConnected}
              bookmarked={currentBookmarks} setBookmarked={setNotebookBookmarks}
              tweaks={tweaks}
            />
          </div>
        )}
      </div>

      <Tweaks tweaks={tweaks} setTweak={setTweak}/>
    </div>
  );
}

function Screens({
  view, modal, notebook, notebooks,
  openNotebook, goLibrary, openSettings, closeSettings,
  setModal, createNotebook, addPage,
  connected, latency, setConnected,
  bookmarked, setBookmarked,
  tweaks,
}) {
  // Track currentPage from CanvasScreen so modals can show it
  const [canvasPage, setCanvasPage] = useAState(2);
  return (
    <>
      {view === 'library' && (
        <LibraryScreen
          data={notebooks}
          onOpen={openNotebook}
          onNewNotebook={() => setModal('new')}
          onSettings={openSettings}
          onConnection={() => setModal('connection')}
          connected={connected} latency={latency}
        />
      )}

      {view === 'canvas' && notebook && (
        <CanvasScreenWrap
          notebook={notebook} layout={tweaks.layout}
          onBackToLibrary={goLibrary}
          onPagesOverview={() => setModal('pages')}
          onShare={() => setModal('share')}
          onConnection={() => setModal('connection')}
          onSettings={openSettings}
          onNewPage={addPage}
          connected={connected} latency={latency}
          bookmarked={bookmarked} setBookmarked={setBookmarked}
          onPageChange={setCanvasPage}
        />
      )}

      {view === 'settings' && (
        <SettingsScreen onClose={closeSettings} connected={connected} latency={latency}/>
      )}

      {modal === 'new' && (
        <NewNotebookModal onClose={() => setModal(null)} onCreate={createNotebook}/>
      )}
      {modal === 'pages' && notebook && (
        <PagesOverviewModal notebook={notebook} currentPage={canvasPage} bookmarked={bookmarked}
          onClose={() => setModal(null)}
          onSelect={(n) => { setCanvasPage(n); setModal(null); }}
          onNewPage={() => { addPage(); }}/>
      )}
      {modal === 'share' && notebook && (
        <ShareModal notebook={notebook} onClose={() => setModal(null)}/>
      )}
      {modal === 'connection' && (
        <ConnectionModal connected={connected} latency={latency}
          onClose={() => setModal(null)}
          onConnect={(d) => { setConnected(true); setModal(null); }}
          onDisconnect={() => { setConnected(false); }}/>
      )}
    </>
  );
}

// Wrapper that lets parent track canvas page (needed for Pages modal)
function CanvasScreenWrap(props) {
  // CanvasScreen owns its own page state internally; we bubble via key only
  return <CanvasScreen {...props}/>;
}

// ─────────────────────────────────────────────────────────────
// Tweaks panel
// ─────────────────────────────────────────────────────────────
function Tweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Layout">
        <TweakRadio label="Toolbar"
          value={tweaks.layout} onChange={v => setTweak('layout', v)}
          options={[
            { value: 'floating', label: 'Floating' },
            { value: 'sidebar',  label: 'Sidebar' },
            { value: 'dock',     label: 'Dock' },
          ]}/>
        <TweakToggle label="iPad frame" value={tweaks.frame} onChange={v => setTweak('frame', v)}/>
      </TweakSection>

      <TweakSection title="Connection">
        <TweakToggle label="Connected to desktop" value={tweaks.connected} onChange={v => setTweak('connected', v)}/>
      </TweakSection>
    </TweaksPanel>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
