// NoteBridge — main design canvas wiring all variations together

// iPad Pro 11" landscape — 1180×820 logical points
const SCREEN_W = 1180;
const SCREEN_H = 820;
const BEZEL = 22;
const WIN_W = SCREEN_W + BEZEL * 2;
const WIN_H = SCREEN_H + BEZEL * 2;

// iPad device frame — uniform bezel, rounded corners, camera dot
function WindowFrame({ children }) {
  return (
    <div style={{
      width: WIN_W, height: WIN_H, borderRadius: 38, padding: BEZEL,
      background: '#1a1a1c',
      boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06), 0 30px 60px rgba(0,0,0,0.22), 0 8px 16px rgba(0,0,0,0.10)',
      position: 'relative',
    }}>
      {/* front camera (landscape — top edge, centered) */}
      <div style={{
        position:'absolute', top: 10, left:'50%', transform:'translateX(-50%)',
        width: 6, height: 6, borderRadius:'50%', background:'#0a0a0c',
        boxShadow:'inset 0 0 0 0.5px rgba(255,255,255,0.15)',
      }}/>
      <div style={{
        width: SCREEN_W, height: SCREEN_H, borderRadius: 18, overflow: 'hidden',
        background: 'var(--paper)', position:'relative',
      }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="canvas" title="Note canvas" subtitle="The main editor — three layout directions for tools, paper, and chrome.">
        <DCArtboard id="floating" label="A · Floating toolbar" width={WIN_W} height={WIN_H}>
          <WindowFrame><VariantFloating/></WindowFrame>
        </DCArtboard>
        <DCArtboard id="sidebar" label="B · Sidebar workspace" width={WIN_W} height={WIN_H}>
          <WindowFrame><VariantSidebar/></WindowFrame>
        </DCArtboard>
        <DCArtboard id="dock" label="C · Bottom dock" width={WIN_W} height={WIN_H}>
          <WindowFrame><VariantDock/></WindowFrame>
        </DCArtboard>
        <DCPostIt top={-30} right={-220} rotate={3} width={200}>
          All three share the same paper, ink palette, and warm whites — only the chrome differs.
        </DCPostIt>
      </DCSection>

      <DCSection id="library" title="Library" subtitle="Where notebooks live. Two ways to browse.">
        <DCArtboard id="grid" label="A · Cover grid" width={WIN_W} height={WIN_H}>
          <WindowFrame><LibraryGrid/></WindowFrame>
        </DCArtboard>
        <DCArtboard id="shelf" label="B · Sectioned shelves" width={WIN_W} height={WIN_H}>
          <WindowFrame><LibraryShelf/></WindowFrame>
        </DCArtboard>
      </DCSection>

      <DCSection id="setup" title="Setup &amp; overview" subtitle="Creating notebooks and navigating pages.">
        <DCArtboard id="new" label="New notebook" width={WIN_W} height={WIN_H}>
          <WindowFrame><div style={{position:'relative', width:'100%', height:'100%'}}>
            {/* show modal on top of dimmed library */}
            <div style={{position:'absolute', inset:0, filter:'blur(2px) saturate(0.7)', opacity:0.7}}><LibraryGrid/></div>
            <div style={{position:'absolute', inset:0}}><TemplatePicker/></div>
          </div></WindowFrame>
        </DCArtboard>
        <DCArtboard id="pages" label="Pages overview" width={WIN_W} height={WIN_H}>
          <WindowFrame><PagesOverview/></WindowFrame>
        </DCArtboard>
      </DCSection>

      <DCSection id="connection" title="iPad connection" subtitle="Discovery, connected, and the live status pill.">
        <DCArtboard id="discovery" label="Discovery" width={WIN_W} height={WIN_H}>
          <WindowFrame><ConnectionDiscovery/></WindowFrame>
        </DCArtboard>
        <DCArtboard id="connected" label="Connected" width={WIN_W} height={WIN_H}>
          <WindowFrame><ConnectionConnected/></WindowFrame>
        </DCArtboard>
        <DCPostIt top={-30} right={-220} rotate={-3} width={220}>
          Connected pill lives in every top bar — sage = healthy, red = dropped. Click ×&nbsp;to disconnect.
        </DCPostIt>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
