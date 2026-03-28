'use strict';

// ── Bridge ───────────────────────────────────────────────────────────────────
//
// Auto-detects the host context and provides a unified send/receive API.
//
//  • Electron hidden window  → window.__electronIPCBridge (injected by preload-ipad.js)
//  • iPad WKWebView (offline)→ window.webkit.messageHandlers.noteBridge
//  • Standalone browser      → no-op (local-only mode for dev/testing)

const Bridge = (() => {
  const handlers = {};

  function send(type, data) {
    if (window.__electronIPCBridge) {
      window.__electronIPCBridge.send(type, data);
    } else if (window.webkit?.messageHandlers?.noteBridge) {
      window.webkit.messageHandlers.noteBridge.postMessage(JSON.stringify({ type, data }));
    }
    // else: standalone — no sync needed
  }

  function on(type, fn) {
    handlers[type] = fn;
  }

  // Called by the host (Electron IPC reply or Swift evaluateJavaScript)
  function receive(type, data) {
    if (handlers[type]) handlers[type](data);
  }

  return { send, on, receive };
})();

// Expose so the host can call: window.bridgeReceive(type, data)
window.bridgeReceive = (type, data) => Bridge.receive(type, data);


// ── App ──────────────────────────────────────────────────────────────────────

(function initApp() {
  const drawingCanvas = document.getElementById('drawing-canvas');
  const cursorCanvas  = document.getElementById('cursor-canvas');

  const engine = new CanvasEngine(drawingCanvas, cursorCanvas);

  // ── Tool selection ─────────────────────────────────

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      engine.tool = btn.dataset.tool;
    });
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      engine.color = btn.dataset.color;
      // Switch to pen tool when color is selected
      selectTool('pen');
    });
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      engine.size = parseFloat(btn.dataset.size);
    });
  });

  function selectTool(name) {
    engine.tool = name;
    document.querySelectorAll('.tool-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === name);
    });
  }

  // ── Undo / Redo ────────────────────────────────────

  document.getElementById('btn-undo').addEventListener('click', () => engine.undo());
  document.getElementById('btn-redo').addEventListener('click', () => engine.redo());

  // Keyboard shortcuts (useful in Electron hidden window)
  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); engine.undo(); }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); engine.redo(); }
  });

  // ── Page navigation ────────────────────────────────

  function updatePageUI() {
    document.getElementById('page-indicator').textContent =
      `${engine.currentPage + 1} / ${engine.pageCount}`;
    document.getElementById('btn-prev').disabled = engine.currentPage === 0;
    document.getElementById('btn-next').disabled = engine.currentPage === engine.pageCount - 1;
  }

  document.getElementById('btn-prev').addEventListener('click', () => {
    engine.switchPage(engine.currentPage - 1);
    updatePageUI();
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    engine.switchPage(engine.currentPage + 1);
    updatePageUI();
  });

  document.getElementById('btn-add-page').addEventListener('click', () => {
    engine.addPage();
    updatePageUI();
  });

  updatePageUI();

  // ── Bridge message handlers ────────────────────────

  // Host sends full page state (on connect or page switch)
  Bridge.on('page_state', data => {
    engine.loadPageState(data);
    updatePageUI();
  });

  // Host sends cursor position (Windows mouse on iPad screen)
  Bridge.on('cursor_pos', data => {
    engine.setCursor(data.x, data.y);
  });

  // Host confirms undo from another source
  Bridge.on('undo', () => {
    const page = engine.pages[engine.currentPage];
    if (page.length > 0) {
      const s = page.pop();
      engine.redoStacks[engine.currentPage].push(s);
      engine.redraw();
    }
    updatePageUI();
  });

  Bridge.on('redo', () => {
    const stack = engine.redoStacks[engine.currentPage];
    if (stack.length > 0) {
      engine.pages[engine.currentPage].push(stack.pop());
      engine.redraw();
    }
    updatePageUI();
  });

  // ── Auto-save (offline / Electron mode) ───────────

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      Bridge.send('save_state', engine.getPageState());
    }, 1500);
  }

  // Watch for stroke completions to trigger save
  const origOnUp = engine._onUp.bind(engine);
  engine.dc.addEventListener('pointerup', () => scheduleSave());

  // ── Initial state request ──────────────────────────

  // Ask the host for current page state if connected
  Bridge.send('request_state', {});

  // Signal ready
  Bridge.send('ready', {});
})();
