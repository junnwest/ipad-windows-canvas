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
      `${engine.currentPage + 1} of ${engine.pageCount}`;
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

  // Tool / color / size changes sent from the iPad toolbar in connected mode
  Bridge.on('tool_change', data => {
    if (!data.tool) return;
    engine.tool = data.tool;
    document.querySelectorAll('.tool-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tool === data.tool));
  });

  Bridge.on('color_change', data => {
    if (!data.color) return;
    engine.color = data.color;
    engine.tool  = 'pen';
    document.querySelectorAll('.color-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.color === data.color));
    document.querySelectorAll('.tool-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tool === 'pen'));
  });

  Bridge.on('size_change', data => {
    if (data.size == null) return;
    engine.size = Number(data.size);
    document.querySelectorAll('.size-btn').forEach(b =>
      b.classList.toggle('active', Number(b.dataset.size) === engine.size));
  });

  // ── Connection status pill ─────────────────────────

  const pill = document.getElementById('connection-pill');
  const pillDevice = document.getElementById('pill-device');
  const pillLatency = document.getElementById('pill-latency');

  Bridge.on('connection_status', data => {
    if (data && data.connected) {
      pillDevice.textContent = data.deviceName || 'Windows PC';
      pillLatency.textContent = data.latency ? ` ${data.latency}` : '';
      pill.classList.remove('hidden');
    } else {
      pill.classList.add('hidden');
    }
  });

  document.getElementById('pill-dismiss').addEventListener('click', () => {
    pill.classList.add('hidden');
    Bridge.send('disconnect', {});
  });

  // ── Notebook title ──────────────────────────────────

  Bridge.on('set_title', data => {
    if (data && data.title) {
      document.getElementById('nav-title').textContent = data.title;
    }
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
