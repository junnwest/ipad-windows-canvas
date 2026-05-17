'use strict';

// ── Bridge ────────────────────────────────────────────────────
// Auto-detects host context and provides a unified send/receive API.
//  • Electron hidden window  → window.__electronIPCBridge
//  • iPad WKWebView          → window.webkit.messageHandlers.noteBridge
//  • Standalone browser      → no-op

const Bridge = (() => {
  const handlers = {};

  function send(type, data) {
    if (window.__electronIPCBridge) {
      window.__electronIPCBridge.send(type, data);
    } else if (window.webkit?.messageHandlers?.noteBridge) {
      window.webkit.messageHandlers.noteBridge.postMessage(JSON.stringify({ type, data }));
    }
  }

  function on(type, fn) { handlers[type] = fn; }

  function receive(type, data) {
    if (handlers[type]) handlers[type](data);
  }

  return { send, on, receive };
})();

window.bridgeReceive = (type, data) => Bridge.receive(type, data);

if (window.__electronIPCBridge?.onMessage) {
  window.__electronIPCBridge.onMessage((type, data) => Bridge.receive(type, data));
}

// ── Constants ─────────────────────────────────────────────────

const COLORS = [
  '#1c1814', '#b35040', '#486488', '#5c7058',
  '#b89868', '#d6b25a', '#8c6aa6', '#cc7a5a',
];

const SIZES = [1.5, 2.5, 4, 6, 9];

const COVER_COLORS = [
  '#5c7058', '#486488', '#b35040', '#b89868',
  '#3d3936', '#8c6aa6', '#a86a4a', '#41524a',
];

const SEED_NOTEBOOKS = [
  { id: 'field',   color: '#5c7058', title: 'Field notes',     pages: 12, edited: '2 hours ago',   lastPage: 2 },
  { id: 'meet',    color: '#486488', title: 'Meeting notes',   pages: 24, edited: 'Yesterday',     lastPage: 5 },
  { id: 'sketch',  color: '#b35040', title: 'Sketchbook',      pages: 18, edited: 'Monday',        lastPage: 5 },
  { id: 'q3',      color: '#b89868', title: 'Q3 planning',     pages: 16, edited: 'Last week',     lastPage: 1 },
  { id: 'studio',  color: '#3d3936', title: 'Studio',          pages: 31, edited: '2 weeks ago',   lastPage: 5 },
  { id: 'travel',  color: '#8c6aa6', title: 'Travel journal',  pages: 8,  edited: 'Apr 22',        lastPage: 1 },
  { id: 'recipes', color: '#a86a4a', title: 'Recipe book',     pages: 22, edited: 'Apr 10',        lastPage: 6 },
];

// ── App State ─────────────────────────────────────────────────

const state = {
  view:           'library',    // 'library' | 'canvas' | 'settings'
  notebookId:     null,
  tool:           'pen',
  color:          COLORS[0],
  size:           2.5,
  penWellOpen:    false,
  libView:        'grid',       // 'grid' | 'shelf'
  notebooks:      [...SEED_NOTEBOOKS],
  bookmarked:     { field: { 1: true } },
  connected:      false,
  deviceName:     '',
  latency:        0,
  searchQuery:    '',
  settingsSection:'connection',
  activeMenu:     null,         // notebook id with open context menu
  engineInited:   false,
};

let engine = null; // CanvasEngine — lazy-initialized on first canvas screen visit

// ── Status bar time ───────────────────────────────────────────

function updateClocks() {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const t = `${h}:${m}`;
  document.querySelectorAll('.status-time').forEach(el => el.textContent = t);
}
updateClocks();
setInterval(updateClocks, 30000);

// ── Status trailing (battery + wifi indicators) ───────────────

function statusTrailingHTML() {
  return `
    <svg width="17" height="11" viewBox="0 0 17 11">
      <rect x="0" y="7" width="3" height="4" rx="0.6" fill="rgba(28,24,20,0.88)"/>
      <rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="rgba(28,24,20,0.88)"/>
      <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill="rgba(28,24,20,0.88)"/>
      <rect x="13.5" y="0" width="3" height="11" rx="0.6" fill="rgba(28,24,20,0.88)"/>
    </svg>
    <svg width="16" height="11" viewBox="0 0 16 11">
      <path d="M8 3C10 3 11.8 3.8 13.2 5L14.2 4C12.6 2.4 10.4 1.4 8 1.4C5.6 1.4 3.4 2.4 1.8 4L2.8 5C4.2 3.8 6 3 8 3Z" fill="rgba(28,24,20,0.88)"/>
      <path d="M8 6.2C9.2 6.2 10.3 6.6 11.1 7.4L12.1 6.4C10.95 5.3 9.55 4.6 8 4.6C6.45 4.6 5.05 5.3 3.9 6.4L4.9 7.4C5.7 6.6 6.8 6.2 8 6.2Z" fill="rgba(28,24,20,0.88)"/>
      <circle cx="8" cy="9.5" r="1.4" fill="rgba(28,24,20,0.88)"/>
    </svg>
    <svg width="26" height="12" viewBox="0 0 26 12">
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="rgba(28,24,20,0.88)" stroke-opacity="0.4" fill="none"/>
      <rect x="2" y="2" width="15" height="8" rx="1.6" fill="rgba(28,24,20,0.88)"/>
      <path d="M24 4v4c.7-.25 1.3-1 1.3-2s-.6-1.75-1.3-2Z" fill="rgba(28,24,20,0.88)" fill-opacity="0.4"/>
    </svg>`;
}

document.querySelectorAll('.status-trailing').forEach(el => {
  el.innerHTML = statusTrailingHTML();
});

// ── Notebook cover HTML ───────────────────────────────────────

function coverHTML(nb, w, h) {
  w = w || 152; h = h || 200;
  const small  = w < 90;
  const medium = w >= 90 && w < 140;
  const titleSize = small ? 9 : medium ? 13 : 16;
  const subSize   = small ? 7.5 : medium ? 9.5 : 10;
  const mt        = small ? 5 : 8;
  const inL = small ? 10 : medium ? 16 : 22;
  const inR = small ? 6  : medium ? 11 : 16;
  const inT = small ? 9  : medium ? 18 : 26;
  const inB = small ? 9  : medium ? 18 : 26;
  const showSub   = !small;
  const showStamp = w >= 110;
  const pid = 'p' + Math.random().toString(36).slice(2, 8);

  return `
<div class="nb-cover" style="width:${w}px;height:${h}px;background:${nb.color}">
  <div class="nb-cover-spine" style="width:${small?6:12}px"></div>
  <svg class="nb-cover-fabric" width="100%" height="100%">
    <defs><pattern id="${pid}" width="3" height="3" patternUnits="userSpaceOnUse">
      <path d="M0 0L3 3M3 0L0 3" stroke="white" stroke-width="0.3"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(#${pid})"/>
  </svg>
  <div class="nb-cover-label" style="top:${inT}px;bottom:${inB}px;left:${inL}px;right:${inR}px">
    <div>
      <div class="nb-cover-title" style="font-size:${titleSize}px;-webkit-line-clamp:${small?1:2}">${escapeHTML(nb.title)}</div>
      ${showSub ? `<div class="nb-cover-sub" style="font-size:${subSize}px;margin-top:${mt}px">${nb.pages} pages</div>` : ''}
    </div>
    ${showStamp ? `<div class="nb-cover-stamp">NoteBridge</div>` : ''}
  </div>
</div>`;
}

function escapeHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Screen routing ────────────────────────────────────────────

function showScreen(name) {
  state.view = name;
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.toggle('hidden', el.id !== 'screen-' + name);
  });

  if (name === 'canvas' && !state.engineInited) {
    initCanvas();
  }
  if (name === 'library') {
    renderLibrary();
  }
  if (name === 'settings') {
    renderSettingsSection(state.settingsSection);
  }
  closeModal();
  state.penWellOpen = false;
  closePenWell();
}

// ── Canvas initialization (lazy) ──────────────────────────────

function initCanvas() {
  if (state.engineInited) return;
  const dc = document.getElementById('drawing-canvas');
  const cc = document.getElementById('cursor-canvas');
  engine = new CanvasEngine(dc, cc);
  engine.color = state.color;
  engine.size  = state.size;
  engine.tool  = state.tool;
  state.engineInited = true;

  dc.addEventListener('pointerup', () => scheduleSave());
}

// ── Auto-save ─────────────────────────────────────────────────

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (engine) Bridge.send('save_state', engine.getPageState());
  }, 1500);
}

// ── Tool / Color / Size setters ───────────────────────────────

function setTool(name) {
  state.tool = name;
  if (engine) engine.tool = name;

  document.querySelectorAll('[data-tool]').forEach(btn => {
    const active = btn.dataset.tool === name;
    btn.classList.toggle('active', active);
    const dot = btn.querySelector('.tb-dot');
    if (dot) {
      if (active && (name === 'pen' || name === 'highlighter')) {
        dot.style.background = state.color;
        btn.style.color = state.color;
      } else if (active) {
        dot.style.background = 'var(--ink)';
        btn.style.color = '';
      } else {
        btn.style.color = '';
      }
    }
  });
}

function setColor(c) {
  state.color = c;
  if (engine) engine.color = c;
  updatePenWellTrigger();

  // Keep active pen/highlighter dot in sync
  if (state.tool === 'pen' || state.tool === 'highlighter') {
    document.querySelectorAll('[data-tool].active').forEach(btn => {
      const dot = btn.querySelector('.tb-dot');
      if (dot) { dot.style.background = c; btn.style.color = c; }
    });
  }

  // Update pw color button selection
  document.querySelectorAll('.pw-color-btn').forEach(btn => {
    const selected = btn.dataset.color === c;
    btn.style.boxShadow = selected
      ? `0 0 0 2px var(--paper), 0 0 0 3.5px ${c === '#1c1814' ? '#5c7058' : 'var(--ink)'}`
      : 'inset 0 0 0 1px rgba(0,0,0,0.10)';
  });
}

function setSize(s) {
  state.size = s;
  if (engine) engine.size = s;
  updatePenWellTrigger();

  document.querySelectorAll('.pw-size-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.size) === s);
  });
}

function updatePenWellTrigger() {
  const dot = document.getElementById('pw-color-dot');
  const bar = document.getElementById('pw-size-bar');
  if (dot) dot.style.background = state.color;
  if (bar) {
    const d = Math.round(state.size * 1.6);
    const clampD = Math.min(d, 16);
    bar.style.width  = '18px';
    bar.style.height = clampD + 'px';
    bar.style.background = state.color;
    bar.style.borderRadius = clampD + 'px';
  }
}

// ── Pen well ──────────────────────────────────────────────────

function openPenWell() {
  const popup = document.getElementById('pen-well-popup');
  const trigger = document.getElementById('pen-well-trigger');
  if (!popup || !trigger) return;
  state.penWellOpen = true;
  popup.classList.remove('hidden');
  trigger.classList.add('open');
}

function closePenWell() {
  const popup = document.getElementById('pen-well-popup');
  const trigger = document.getElementById('pen-well-trigger');
  if (popup) popup.classList.add('hidden');
  if (trigger) trigger.classList.remove('open');
  state.penWellOpen = false;
}

function initPenWell() {
  const colorsEl = document.getElementById('pw-colors');
  const sizesEl  = document.getElementById('pw-sizes');
  if (!colorsEl || !sizesEl) return;

  colorsEl.innerHTML = COLORS.map(c => `
    <button class="pw-color-btn" data-color="${c}"
      style="background:${c};box-shadow:${c === state.color
        ? `0 0 0 2px var(--paper), 0 0 0 3.5px ${c==='#1c1814'?'#5c7058':'var(--ink)'}`
        : 'inset 0 0 0 1px rgba(0,0,0,0.10)'
      }">
    </button>`).join('');

  sizesEl.innerHTML = SIZES.map(s => `
    <button class="pw-size-btn${s === state.size ? ' active' : ''}" data-size="${s}">
      <span class="pw-size-dot" style="width:${Math.min(s*2.4,22)}px;height:${Math.min(s*2.4,22)}px;background:${state.color}"></span>
    </button>`).join('');

  colorsEl.querySelectorAll('.pw-color-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setColor(btn.dataset.color);
      if (state.tool !== 'pen' && state.tool !== 'highlighter') setTool('pen');
    });
  });
  sizesEl.querySelectorAll('.pw-size-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setSize(Number(btn.dataset.size));
    });
  });

  updatePenWellTrigger();
}

// ── Page navigation ───────────────────────────────────────────

function updatePageUI() {
  if (!engine) return;
  const cur   = engine.currentPage + 1;
  const total = engine.pageCount;
  const indicator = document.getElementById('page-indicator');
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  if (indicator) indicator.textContent = `${cur} / ${total}`;
  if (prev) prev.disabled = engine.currentPage === 0;
  if (next) next.disabled = engine.currentPage === engine.pageCount - 1;

  // Update title bar page info
  const nb = currentNotebook();
  if (nb) {
    const info = document.getElementById('nb-page-info');
    if (info) info.textContent = `p. ${cur} / ${nb.pages}`;
  }
}

// ── Status pill update ────────────────────────────────────────

function updateStatusPills() {
  document.querySelectorAll('.status-pill').forEach(pill => {
    const dot = pill.querySelector('.spill-dot');
    const latEl = pill.querySelector('.spill-latency');
    pill.classList.toggle('connected', state.connected);
    if (latEl) latEl.textContent = state.connected ? `${state.latency} ms` : 'Offline';
  });
}

// ── Current notebook helper ───────────────────────────────────

function currentNotebook() {
  return state.notebooks.find(n => n.id === state.notebookId) || null;
}

// ── Open notebook (library → canvas) ─────────────────────────

function openNotebook(id) {
  const nb = state.notebooks.find(n => n.id === id);
  if (!nb) return;
  state.notebookId = id;

  // Update title bar
  const colorBar = document.getElementById('nb-color-bar');
  const nameEl   = document.getElementById('nb-name');
  const infoEl   = document.getElementById('nb-page-info');
  if (colorBar) colorBar.style.background = nb.color;
  if (nameEl) nameEl.textContent = nb.title;
  if (infoEl) infoEl.textContent = '';

  showScreen('canvas');
  updatePageUI();
}

// ── Library rendering ─────────────────────────────────────────

function renderLibrary() {
  const q    = state.searchQuery.toLowerCase();
  const all  = state.notebooks.filter(n => !q || n.title.toLowerCase().includes(q));
  const content = document.getElementById('lib-content');
  const subText = document.getElementById('lib-sub-text');
  if (!content) return;

  if (subText) subText.textContent = `${all.length} notebook${all.length !== 1 ? 's' : ''}`;

  content.className = state.libView === 'shelf' ? 'shelf-view' : '';

  if (state.libView === 'grid') {
    renderGridView(content, all);
  } else {
    renderShelfView(content, all);
  }
}

function renderGridView(container, notebooks) {
  const recent = notebooks.slice(0, 3);

  container.innerHTML = `
    ${recent.length > 0 ? `
    <div id="lib-recent">
      <div class="section-label">
        <span class="section-label-main">Recent</span>
        <span class="section-label-sub">this week</span>
      </div>
      <div class="recent-strip">
        ${recent.map(nb => `
          <button class="recent-item" data-open="${nb.id}">
            ${coverHTML(nb, 56, 76)}
            <div class="recent-info">
              <div class="recent-title">${escapeHTML(nb.title)}</div>
              <div class="recent-edited">${escapeHTML(nb.edited)}</div>
              <div class="recent-pages">${nb.pages} pages</div>
            </div>
          </button>`).join('')}
      </div>
    </div>` : ''}

    <div id="lib-all-label" class="section-label">
      <span class="section-label-main">All notebooks</span>
      <span class="section-label-sub">${notebooks.length}</span>
    </div>
    <div class="nb-grid">
      ${notebooks.map(nb => `
        <div class="nb-tile" data-id="${nb.id}">
          <button class="nb-tile-btn" data-open="${nb.id}">
            <div class="nb-cover-wrap">${coverHTML(nb, 152, 200)}</div>
            <div>
              <div class="nb-tile-info-title">${escapeHTML(nb.title)}</div>
              <div class="nb-tile-info-edited">${escapeHTML(nb.edited)}</div>
            </div>
          </button>
          <button class="nb-menu-btn${state.activeMenu===nb.id?' open':''}" data-menu="${nb.id}" title="More options">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="4" cy="9" r="1.4" fill="currentColor"/><circle cx="9" cy="9" r="1.4" fill="currentColor"/><circle cx="14" cy="9" r="1.4" fill="currentColor"/></svg>
          </button>
          ${state.activeMenu === nb.id ? contextMenuHTML() : ''}
        </div>`).join('')}
      <button class="nb-new-tile" id="lib-new-tile-btn">
        <div class="nb-new-cover">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </div>
        <div class="nb-new-label">New notebook</div>
      </button>
    </div>`;

  // Bind events
  container.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => openNotebook(btn.dataset.open));
  });
  container.querySelectorAll('[data-menu]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      state.activeMenu = state.activeMenu === btn.dataset.menu ? null : btn.dataset.menu;
      renderLibrary();
    });
  });
  const newTile = container.querySelector('#lib-new-tile-btn');
  if (newTile) newTile.addEventListener('click', () => openModal('new'));
}

function contextMenuHTML() {
  return `<div class="nb-context-menu">
    <button class="ctx-menu-item"><svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 13.5L3 15h1.5L13 6.5l-1.5-1.5L3 13.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M11.5 5l1.5 1.5M2 16h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Rename</button>
    <button class="ctx-menu-item"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M11 5V3.5a1 1 0 00-1-1H3.5a1 1 0 00-1 1V10a1 1 0 001 1H5" stroke="currentColor" stroke-width="1.4"/></svg>Duplicate</button>
    <button class="ctx-menu-item"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 11v2.5h10V11M8 2v8M8 2L5 5M8 2l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Export PDF</button>
    <div class="ctx-divider"></div>
    <button class="ctx-menu-item danger"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2.5h4V4M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Move to trash</button>
  </div>`;
}

function renderShelfView(container, notebooks) {
  const groups = [
    { title: 'Active',    subtitle: 'In rotation',       ids: ['field','meet','q3'] },
    { title: 'Sketching', subtitle: 'Visual notebooks',  ids: ['sketch','studio'] },
    { title: 'Personal',  subtitle: 'Journals & travel', ids: ['travel','recipes'] },
  ].map(g => ({ ...g, books: notebooks.filter(n => g.ids.includes(n.id)) }))
   .filter(g => g.books.length > 0);

  if (groups.length === 0) {
    container.innerHTML = '<div style="padding:36px;color:var(--ink-mute);font-size:14px">No notebooks</div>';
    return;
  }

  container.innerHTML = groups.map((g, gi) => `
    <div class="shelf-group">
      <div class="shelf-header">
        <span class="shelf-header-title">${g.title}</span>
        <span class="shelf-header-sub">${g.subtitle}</span>
        <span class="shelf-count">${g.books.length} ${g.books.length===1?'notebook':'notebooks'}</span>
      </div>
      <div class="shelf-track-wrap">
        <div class="shelf-track">
          ${g.books.map(nb => `
            <button class="shelf-book-btn" data-open="${nb.id}">
              ${coverHTML(nb, 128, 172)}
            </button>`).join('')}
          ${gi === groups.length - 1 ? `
            <button class="shelf-new-btn" id="shelf-new-btn" style="width:128px;height:172px">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>` : ''}
        </div>
        <div class="shelf-line"></div>
        <div class="shelf-shadow"></div>
      </div>
    </div>`).join('');

  container.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => openNotebook(btn.dataset.open));
  });
  const newBtn = container.querySelector('#shelf-new-btn');
  if (newBtn) newBtn.addEventListener('click', () => openModal('new'));
}

// ── Settings rendering ────────────────────────────────────────

function renderSettingsSection(section) {
  state.settingsSection = section;
  document.querySelectorAll('.snav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  const content = document.getElementById('settings-content');
  if (!content) return;

  const sections = {
    connection: renderConnectionSettings,
    pencil:     renderPencilSettings,
    paper:      renderPaperSettings,
    sync:       renderSyncSettings,
    shortcuts:  renderShortcutsSettings,
    about:      renderAboutSettings,
  };

  content.innerHTML = '';
  const fn = sections[section];
  if (fn) fn(content);
}

function switchHTML(id, on) {
  return `<button class="switch-btn${on?' on':''}" data-switch="${id}"><span class="switch-knob"></span></button>`;
}
function bindSwitch(el, id, onChange) {
  const btn = el.querySelector(`[data-switch="${id}"]`);
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('on');
    onChange(btn.classList.contains('on'));
  });
}

function segControlHTML(id, opts, val) {
  return `<div class="seg-control" data-seg="${id}">${opts.map(o =>
    `<button class="seg-btn${o.id===val?' active':''}" data-val="${o.id}">${o.label}</button>`
  ).join('')}</div>`;
}
function bindSeg(el, id, onChange) {
  const ctrl = el.querySelector(`[data-seg="${id}"]`);
  if (!ctrl) return;
  ctrl.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ctrl.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.val);
    });
  });
}

function sliderHTML(id, val, min, max, step, fmt) {
  return `<div class="range-row">
    <input type="range" data-slider="${id}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:180px;accent-color:var(--sage)">
    <span class="range-val" data-slider-val="${id}">${fmt ? fmt(val) : val}</span>
  </div>`;
}
function bindSlider(el, id, fmt, onChange) {
  const inp = el.querySelector(`[data-slider="${id}"]`);
  const out = el.querySelector(`[data-slider-val="${id}"]`);
  if (!inp || !out) return;
  inp.addEventListener('input', () => {
    const v = parseFloat(inp.value);
    out.textContent = fmt ? fmt(v) : v;
    onChange(v);
  });
}

function settingsRow(opts) {
  const iconHTML = opts.icon ? `<div class="settings-row-icon">${opts.icon}</div>` : '';
  const subHTML  = opts.subtitle ? `<div class="settings-row-sub">${opts.subtitle}</div>` : '';
  return `<div class="settings-row${opts.last?'':''} ${opts.onClick?'clickable':''}">
    ${iconHTML}
    <div class="settings-row-text">
      <div class="settings-row-title">${opts.title}</div>
      ${subHTML}
    </div>
    <div class="settings-row-control">${opts.control||''}</div>
  </div>`;
}

function settingsGroup(title, rows) {
  const titleHTML = title ? `<div class="settings-group-title">${title}</div>` : '';
  return `<div class="settings-group">${titleHTML}<div class="settings-group-body">${rows}</div></div>`;
}

function renderConnectionSettings(el) {
  const wifiIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 7.5c4-3.5 10-3.5 14 0M4.5 10c2.5-2.2 6.5-2.2 9 0M7 12.5c1.2-1 2.8-1 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="14.5" r="0.9" fill="currentColor"/></svg>`;
  const ipadIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="1.5" width="11" height="15" rx="1.5" stroke="currentColor" stroke-width="1.3"/><circle cx="9" cy="14.2" r=".7" fill="currentColor"/></svg>`;
  const arrowIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 4l5 5-5 5M5 9h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const chevRight = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4.5 2.5l3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const c = state.connected;
  const badgeHTML = c ? `<div class="conn-badge"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5l2 2 3-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` : '';

  el.innerHTML = `
    <div class="settings-section-title">Connection</div>
    <div class="settings-section-sub">Pair this iPad with a desktop NoteBridge window. Drawing, tools, and pages stay in sync.</div>

    <div class="conn-card ${c?'connected':'offline'}">
      <div class="conn-card-icon" style="color:${c?'var(--sage)':'var(--ink-mute)'}">
        ${ipadIcon.replace('width="18"','width="26"').replace('height="18"','height="26"')}
        ${badgeHTML}
      </div>
      <div class="conn-card-info">
        <div class="conn-card-title">${c ? `Connected to ${state.deviceName||'Desktop PC'}` : 'Offline · no desktop paired'}</div>
        <div class="conn-card-sub">${c ? `${state.latency} ms round-trip` : 'Tap Discover to find a desktop on your WiFi'}</div>
      </div>
      <button class="conn-card-btn ${c?'disconnect':'discover'}">${c?'Disconnect':'Discover'}</button>
    </div>

    ${settingsGroup('Discovery', [
      settingsRow({ icon: wifiIcon, title: 'Find devices on WiFi', subtitle: 'Use Bonjour / mDNS to locate desktops broadcasting NoteBridge', control: switchHTML('discovery', true) }),
      settingsRow({ icon: ipadIcon, title: 'Auto-connect to last device', subtitle: 'Reconnect when both are on the same network', control: switchHTML('autoconn', true), last: true }),
    ].join(''))}
    ${settingsGroup('Cursor handoff', [
      settingsRow({ icon: arrowIcon, title: 'Edge to enter iPad', subtitle: 'Cursor moves off this edge of your desktop', control: segControlHTML('cursor', [{id:'right',label:'Right'},{id:'left',label:'Left'},{id:'top',label:'Top'}], 'right'), last: true }),
    ].join(''))}
    ${settingsGroup('Network', [
      settingsRow({ title: 'WebSocket port', subtitle: 'Both devices use the same port', control: '<code style="font-family:var(--font-mono);font-size:12px;color:var(--ink-soft);background:var(--paper-warm);padding:3px 8px;border-radius:5px">8080</code>' }),
      settingsRow({ title: 'Service name', subtitle: 'Advertised over Bonjour', control: '<code style="font-family:var(--font-mono);font-size:12px;color:var(--ink-soft);background:var(--paper-warm);padding:3px 8px;border-radius:5px">_ipadcanvas._tcp</code>' }),
      settingsRow({ title: 'Connect by IP…', subtitle: 'Use when discovery fails', control: `<span style="color:var(--ink-mute)">${chevRight}</span>`, last: true }),
    ].join(''))}`;

  bindSwitch(el, 'discovery', () => {});
  bindSwitch(el, 'autoconn', () => {});
  bindSeg(el, 'cursor', () => {});
}

function renderPencilSettings(el) {
  const pencilIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 13.5L3 15h1.5L13 6.5l-1.5-1.5L3 13.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M11.5 5l1.5 1.5M2 16h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const handIcon  = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 10V4.5a1.2 1.2 0 012.4 0V9" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  const shapeIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="9" height="9" stroke="currentColor" stroke-width="1.4"/><circle cx="13" cy="13" r="4" stroke="currentColor" stroke-width="1.4"/></svg>`;
  const dupIcon   = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M11 5V3.5a1 1 0 00-1-1H3.5a1 1 0 00-1 1V10a1 1 0 001 1H5" stroke="currentColor" stroke-width="1.4"/></svg>`;
  const wifiIcon  = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 7.5c4-3.5 10-3.5 14 0M4.5 10c2.5-2.2 6.5-2.2 9 0M7 12.5c1.2-1 2.8-1 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  el.innerHTML = `
    <div class="settings-section-title">Apple Pencil</div>
    <div class="settings-section-sub">Fine-tune how your Apple Pencil writes, erases, and switches tools.</div>
    ${settingsGroup('Strokes', [
      settingsRow({ icon: pencilIcon, title: 'Pressure sensitivity', subtitle: 'Heavier pressure produces thicker, darker strokes', control: sliderHTML('pressure', 0.75, 0, 1, 0.01, v=>`${Math.round(v*100)}%`) }),
      settingsRow({ icon: handIcon,  title: 'Palm rejection', subtitle: 'Ignore touches from your hand while writing', control: switchHTML('palm', true) }),
      settingsRow({ icon: shapeIcon, title: 'Tilt for shading', subtitle: 'Tilt the pencil to widen highlighter strokes', control: switchHTML('tilt', true), last: true }),
    ].join(''))}
    ${settingsGroup('Gestures', [
      settingsRow({ icon: dupIcon, title: 'Double-tap action', subtitle: 'Tap the side of your Pencil to switch tools', control: segControlHTML('dtap', [{id:'eraser',label:'Eraser'},{id:'last',label:'Last'},{id:'off',label:'Off'}], 'eraser'), last: true }),
    ].join(''))}
    ${settingsGroup('Latency', [
      settingsRow({ icon: wifiIcon, title: 'Client-side prediction', subtitle: 'Draw a local preview stroke instantly, then replace with the streamed frame', control: switchHTML('predict', true), last: true }),
    ].join(''))}`;

  bindSwitch(el, 'palm', () => {});
  bindSwitch(el, 'tilt', () => {});
  bindSwitch(el, 'predict', () => {});
  bindSeg(el, 'dtap', () => {});
  bindSlider(el, 'pressure', v=>`${Math.round(v*100)}%`, () => {});
}

function renderPaperSettings(el) {
  const tones = [
    { id: 'warm',  name: 'Warm cream', color: '#faf6ee' },
    { id: 'paper', name: 'Off-white',  color: '#fcfaf4' },
    { id: 'cool',  name: 'Cool ivory', color: '#f6f6f3' },
    { id: 'dark',  name: 'Walnut',     color: '#2a2520' },
  ];
  const gridIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10" y="2.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2.5" y="10" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10" y="10" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>`;
  const paletteIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a7 7 0 100 14c1 0 1.5-.5 1.5-1.5S10 13 10 12s.7-1.5 1.5-1.5h2a2.5 2.5 0 002.5-2.5A7 7 0 009 2z" stroke="currentColor" stroke-width="1.4"/></svg>`;
  const penIcon = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M14.5 2.5l3 3-10 10L4 16l.5-3.5 10-10z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

  let activeTone = 'warm';

  el.innerHTML = `
    <div class="settings-section-title">Paper &amp; ink</div>
    <div class="settings-section-sub">Set the default look of every new page. Each notebook can override these.</div>
    ${settingsGroup('Paper tone', `
      <div class="paper-tone-grid">
        ${tones.map(t => `
          <button class="paper-tone-btn${t.id===activeTone?' active':''}" data-tone="${t.id}">
            <div class="paper-tone-swatch" style="background:${t.color}"></div>
            <div class="paper-tone-name">${t.name}</div>
          </button>`).join('')}
      </div>`)}
    ${settingsGroup('Default page', [
      settingsRow({ icon: gridIcon, title: 'Template for new pages', subtitle: 'Used when adding a page mid-notebook', control: segControlHTML('template', [{id:'blank',label:'Blank'},{id:'dotted',label:'Dot'},{id:'ruled',label:'Ruled'},{id:'squared',label:'Squared'}], 'dotted') }),
      settingsRow({ icon: paletteIcon, title: 'Show paper shadow', subtitle: 'Lift the page off the canvas with a soft drop shadow', control: switchHTML('shadow', true) }),
      settingsRow({ icon: paletteIcon, title: 'Paper grain', subtitle: 'Subtle paper texture overlay', control: switchHTML('grain', true), last: true }),
    ].join(''))}
    ${settingsGroup('Ink', [
      settingsRow({ icon: penIcon, title: 'Stroke smoothing', subtitle: 'Higher values polish wobbly strokes', control: sliderHTML('smooth', 0.6, 0, 1, 0.01, v=>`${Math.round(v*100)}%`), last: true }),
    ].join(''))}`;

  el.querySelectorAll('.paper-tone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.paper-tone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  bindSwitch(el, 'shadow', () => {});
  bindSwitch(el, 'grain', () => {});
  bindSeg(el, 'template', () => {});
  bindSlider(el, 'smooth', v=>`${Math.round(v*100)}%`, () => {});
}

function renderSyncSettings(el) {
  const cloudIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 13h8.5a2.5 2.5 0 000-5 3.5 3.5 0 00-6.7-1A3 3 0 005 13z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  const dupIcon   = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M11 5V3.5a1 1 0 00-1-1H3.5a1 1 0 00-1 1V10a1 1 0 001 1H5" stroke="currentColor" stroke-width="1.4"/></svg>`;
  const trashIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2.5h4V4M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const chevRight = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4.5 2.5l3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  el.innerHTML = `
    <div class="settings-section-title">Sync &amp; backup</div>
    <div class="settings-section-sub">Notebooks live on your desktop. Your iPad can keep an offline cache.</div>
    ${settingsGroup('Account', `
      <div style="padding:16px;display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--sage);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;font-family:var(--font-display)">K</div>
        <div style="flex:1">
          <div style="font-size:14px;color:var(--ink);font-weight:500">Kenneth</div>
          <div style="font-size:12px;color:var(--ink-mute);font-family:var(--font-mono)">notebridge.local</div>
        </div>
        <button class="btn-secondary" style="font-size:12.5px">Manage</button>
      </div>`)}
    ${settingsGroup('Offline storage', [
      settingsRow({ icon: cloudIcon, title: 'Cache notebooks on this iPad', subtitle: '6 notebooks · 127 pages · 14.8 MB', control: switchHTML('cache', true) }),
      settingsRow({ icon: dupIcon, title: 'Automatic backups', subtitle: 'Daily snapshot to Files / iCloud Drive', control: switchHTML('backup', true) }),
      settingsRow({ icon: trashIcon, title: 'Clear local cache', subtitle: 'Erase offline copies — notebooks remain on your desktop', control: '<button class="btn-secondary" style="font-size:12px;color:var(--red);border-color:rgba(179,80,64,0.3)">Clear</button>', last: true }),
    ].join(''))}
    ${settingsGroup('Recent sync', [
      settingsRow({ title: 'Last full sync', subtitle: 'Just now · 6 notebooks · OK', control: '<span style="font-size:11px;color:var(--sage);font-weight:600;font-family:var(--font-mono)">OK</span>' }),
      settingsRow({ title: 'Sync log', control: `<span style="color:var(--ink-mute)">${chevRight}</span>`, last: true }),
    ].join(''))}`;

  bindSwitch(el, 'cache', () => {});
  bindSwitch(el, 'backup', () => {});
}

function renderShortcutsSettings(el) {
  const groups = [
    { title: 'Tools', items: [['Pen','P'],['Highlighter','H'],['Eraser','E'],['Lasso','L'],['Text','T']] },
    { title: 'Editing', items: [['Undo','⌘ Z'],['Redo','⌘ ⇧ Z'],['Select all','⌘ A'],['Delete','⌫']] },
    { title: 'Navigation', items: [['Next page','→'],['Previous page','←'],['Pages overview','⌘ P'],['Library','⌘ ⇧ L']] },
    { title: 'Connection', items: [['Connect / Discover','⌘ K'],['Toggle cursor handoff','⌥ ⌘ M']] },
  ];

  el.innerHTML = `
    <div class="settings-section-title">Shortcuts</div>
    <div class="settings-section-sub">Keyboard shortcuts when a hardware keyboard or Magic Keyboard is attached.</div>
    ${groups.map(g => settingsGroup(g.title, g.items.map((it, i) =>
      settingsRow({ title: it[0], last: i===g.items.length-1, control: it[1].split(' ').map(k=>`<span class="kbd">${k}</span>`).join('') })
    ).join(''))).join('')}`;
}

function renderAboutSettings(el) {
  const chevRight = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4.5 2.5l3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const infoIcon  = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M9 8v4M9 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const bellIcon  = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 13h10l-1.2-1.5a3 3 0 01-.6-1.8V7.5a3.2 3.2 0 00-6.4 0v2.2a3 3 0 01-.6 1.8L4 13z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 15a1.5 1.5 0 003 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const lockIcon  = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="8" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" stroke-width="1.4"/></svg>`;
  const shareIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v10M9 2L6 5M9 2l3 3M3.5 9v5.5h11V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  el.innerHTML = `
    <div class="settings-section-title">About NoteBridge</div>
    <div class="settings-section-sub">A paper-feeling notebook that pairs with your desktop. Local-first. Offline-capable.</div>
    <div style="padding:24px;background:#fff;border-radius:12px;border:0.5px solid var(--rule);margin-bottom:24px;display:flex;gap:20px;align-items:center">
      ${coverHTML({ id:'about', color:'#5c7058', title:'NoteBridge', pages:0 }, 80, 108)}
      <div style="flex:1">
        <div style="font-family:var(--font-display);font-size:24px;font-weight:600;letter-spacing:-0.3px;font-style:italic">NoteBridge</div>
        <div style="font-size:13px;color:var(--ink-soft);margin-top:6px;line-height:1.5">A real second-screen for your desktop. Same canvas on both ends — the iPad app feels like an iPad app, the Windows app feels like a Windows app.</div>
        <div style="margin-top:14px;display:flex;gap:8px">
          <code style="padding:3px 8px;background:var(--paper-warm);border-radius:5px;font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">v1.0.0 · build 1</code>
        </div>
      </div>
    </div>
    ${settingsGroup('Links', [
      settingsRow({ icon: infoIcon, title: "What's new", subtitle: 'Hidden-window resize, pressure-preserving touch bridge, eraser sync fixes', control: `<span style="color:var(--ink-mute)">${chevRight}</span>` }),
      settingsRow({ icon: bellIcon, title: 'Release notes', control: `<span style="color:var(--ink-mute)">${chevRight}</span>` }),
      settingsRow({ icon: lockIcon, title: 'Privacy & data', subtitle: 'Everything stays on your local network unless you export', control: `<span style="color:var(--ink-mute)">${chevRight}</span>` }),
      settingsRow({ icon: shareIcon, title: 'Send feedback', control: `<span style="color:var(--ink-mute)">${chevRight}</span>`, last: true }),
    ].join(''))}
    <div style="padding:0 4px;font-size:11.5px;color:var(--ink-faint);line-height:1.6">Made with care · Type set in Newsreader · Paper renders best at 100% scale.</div>`;
}

// ── Modal system ──────────────────────────────────────────────

let modalState = {};

function openModal(type, data) {
  modalState = data || {};
  const container = document.getElementById('modal-container');
  if (!container) return;
  container.classList.remove('hidden');

  switch (type) {
    case 'new':        container.innerHTML = newNotebookModalHTML(); bindNewNotebookModal(); break;
    case 'pages':      container.innerHTML = pagesOverviewModalHTML(data); bindPagesOverviewModal(data); break;
    case 'share':      container.innerHTML = shareModalHTML(data); bindShareModal(); break;
    case 'connection': container.innerHTML = connectionModalHTML(); bindConnectionModal(); break;
  }

  container.addEventListener('click', function onScrimClick(e) {
    if (e.target === container) {
      closeModal();
      container.removeEventListener('click', onScrimClick);
    }
  });
}

function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
  modalState = {};
}

// New notebook modal
function newNotebookModalHTML() {
  let name = 'Untitled'; let color = COVER_COLORS[0];
  return `
    <div class="modal-panel" style="width:620px">
      <div class="modal-header">
        <div class="modal-header-text">
          <div class="modal-title">New notebook</div>
          <div class="modal-subtitle">Set a name, cover, and starting template. You can change all of these later.</div>
        </div>
        <button class="modal-close-btn" id="modal-close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:22px;align-items:center">
          <div id="new-nb-preview">${coverHTML({id:'preview',color:COVER_COLORS[0],title:'Untitled',pages:0}, 96, 128)}</div>
          <div style="flex:1">
            <div class="field-label">Title</div>
            <input class="field-input" id="new-nb-name" value="Untitled" placeholder="Notebook name">
            <div style="margin-top:14px">
              <div class="field-label">Cover color</div>
              <div class="cover-colors">
                ${COVER_COLORS.map((c,i) => `<button class="cover-color-btn${i===0?' active':''}" data-cover-color="${c}" style="background:${c}"></button>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="field-label">Paper size</div>
          <div class="size-picker">
            ${[{id:'A4',label:'A4',dim:'210 × 297 mm'},{id:'Letter',label:'Letter',dim:'8.5 × 11 in'},{id:'Square',label:'Square',dim:'1 : 1'}].map((s,i) => `
              <button class="size-pick-btn${i===0?' active':''}" data-paper-size="${s.id}">
                <div class="size-pick-name">${s.label}</div>
                <div class="size-pick-dim">${s.dim}</div>
              </button>`).join('')}
          </div>
        </div>
        <div>
          <div class="field-label">Page template</div>
          <div class="template-picker">
            ${[{id:'blank',name:'Blank'},{id:'dotted',name:'Dot grid'},{id:'ruled',name:'Ruled'},{id:'squared',name:'Squared'},{id:'cornell',name:'Cornell'},{id:'three-col',name:'Three column'}].map((t,i) => `
              <button class="template-pick-btn${i===1?' active':''}" data-template="${t.id}">
                <div class="template-preview">${templateMiniSVG(t.id)}</div>
                <div class="template-name">${t.name}</div>
              </button>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn-primary" id="modal-create">Create notebook</button>
      </div>
    </div>`;
}

function templateMiniSVG(kind) {
  if (kind === 'blank') return '';
  if (kind === 'dotted') return `<svg width="100%" height="100%" style="opacity:.55"><defs><pattern id="m-dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#b0a48d"/></pattern></defs><rect width="100%" height="100%" fill="url(#m-dots)"/></svg>`;
  if (kind === 'ruled') return `<svg width="100%" height="100%" viewBox="0 0 60 80">${[12,20,28,36,44,52,60,68].map(y=>`<line x1="8" x2="54" y1="${y}" y2="${y}" stroke="#bcc8d8" stroke-width=".4"/>`).join('')}<line x1="12" x2="12" y1="0" y2="80" stroke="#d4a8a0" stroke-width=".4"/></svg>`;
  if (kind === 'squared') return `<svg width="100%" height="100%" style="opacity:.65"><defs><pattern id="m-sq" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M7 0H0v7" fill="none" stroke="#c0b39a" stroke-width=".4"/></pattern></defs><rect width="100%" height="100%" fill="url(#m-sq)"/></svg>`;
  if (kind === 'cornell') return `<svg width="100%" height="100%" viewBox="0 0 60 80"><line x1="20" x2="20" y1="10" y2="66" stroke="#c0b39a" stroke-width=".5"/><line x1="6" x2="54" y1="66" y2="66" stroke="#c0b39a" stroke-width=".5"/><line x1="6" x2="54" y1="10" y2="10" stroke="#c0b39a" stroke-width=".5"/></svg>`;
  if (kind === 'three-col') return `<svg width="100%" height="100%" viewBox="0 0 60 80"><line x1="22" x2="22" y1="6" y2="74" stroke="#c0b39a" stroke-width=".5"/><line x1="40" x2="40" y1="6" y2="74" stroke="#c0b39a" stroke-width=".5"/></svg>`;
  return '';
}

function bindNewNotebookModal() {
  const el = document.getElementById('modal-container');
  let selColor = COVER_COLORS[0];
  let selSize = 'A4';
  let selTemplate = 'dotted';

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);

  const nameInput = document.getElementById('new-nb-name');
  nameInput?.addEventListener('input', () => {
    const preview = document.getElementById('new-nb-preview');
    if (preview) preview.innerHTML = coverHTML({id:'preview',color:selColor,title:nameInput.value||'Untitled',pages:0}, 96, 128);
  });

  el.querySelectorAll('.cover-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.cover-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selColor = btn.dataset.coverColor;
      const preview = document.getElementById('new-nb-preview');
      if (preview) preview.innerHTML = coverHTML({id:'preview',color:selColor,title:nameInput?.value||'Untitled',pages:0}, 96, 128);
    });
  });
  el.querySelectorAll('.size-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.size-pick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selSize = btn.dataset.paperSize;
    });
  });
  el.querySelectorAll('.template-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.template-pick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selTemplate = btn.dataset.template;
    });
  });

  document.getElementById('modal-create')?.addEventListener('click', () => {
    const name = nameInput?.value.trim() || 'Untitled';
    const id = 'nb-' + Date.now();
    const nb = { id, color: selColor, title: name, pages: 1, edited: 'Just now', lastPage: 1 };
    state.notebooks = [nb, ...state.notebooks];
    closeModal();
    openNotebook(id);
  });
}

// Pages overview modal
function pagesOverviewModalHTML(data) {
  const nb = currentNotebook();
  if (!nb || !engine) return '<div class="modal-panel" style="width:840px"><div class="modal-body">No notebook open.</div></div>';
  const totalPages = engine.pageCount;
  const bookmarks  = state.bookmarked[state.notebookId] || {};
  const curPage    = engine.currentPage + 1;

  return `
    <div class="modal-panel" style="width:840px">
      <div class="modal-header">
        <div class="modal-header-text">
          <div class="modal-title">${escapeHTML(nb.title)}</div>
          <div class="modal-subtitle">${totalPages} pages · last edited ${escapeHTML(nb.edited)}</div>
        </div>
        <button class="modal-close-btn" id="modal-close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>
      <div class="pages-filter-bar">
        <button class="filter-btn active" data-filter="all">All pages</button>
        <button class="filter-btn inactive" data-filter="bookmarked">Bookmarked</button>
        <div style="flex:1"></div>
        <button id="modal-new-page" style="padding:5px 10px;border:none;background:rgba(28,24,20,0.06);border-radius:6px;font-size:12px;color:var(--ink);font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          New page
        </button>
      </div>
      <div class="pages-grid" id="pages-grid">
        ${Array.from({length:totalPages},(_,i)=>i+1).map(n => `
          <button class="page-thumb-btn" data-page="${n}">
            <div class="page-thumb${n===curPage?' active':''}"></div>
            <div class="page-thumb-info${n===curPage?' active':''}">
              <span>Page ${n}</span>
              ${bookmarks[n] ? `<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3.5 2h7v10l-3.5-2.5L3.5 12V2z" stroke="var(--tan)" stroke-width="1.3" stroke-linejoin="round" fill="var(--tan)"/></svg>` : ''}
            </div>
          </button>`).join('')}
      </div>
    </div>`;
}

function bindPagesOverviewModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-new-page')?.addEventListener('click', () => {
    if (engine) { engine.addPage(); updatePageUI(); }
    closeModal();
  });
  const grid = document.getElementById('pages-grid');
  if (grid) {
    grid.querySelectorAll('.page-thumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.page, 10) - 1;
        if (engine) { engine.switchPage(n); updatePageUI(); }
        closeModal();
      });
    });
  }
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => { b.classList.remove('active'); b.classList.add('inactive'); });
      btn.classList.add('active'); btn.classList.remove('inactive');
    });
  });
}

// Share modal
function shareModalHTML(data) {
  const nb = currentNotebook();
  return `
    <div class="modal-panel" style="width:520px">
      <div class="modal-header">
        <div class="modal-header-text">
          <div class="modal-title">Share &amp; export</div>
          <div class="modal-subtitle">From "${escapeHTML(nb?.title||'Notebook')}"</div>
        </div>
        <button class="modal-close-btn" id="modal-close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>
      <div class="modal-body">
        <div>
          <div class="field-label">Pages</div>
          <div class="size-picker">
            <button class="size-pick-btn active" data-scope="notebook">
              <div class="size-pick-name">All pages</div>
              <div class="size-pick-dim">${nb?.pages||0}</div>
            </button>
            <button class="size-pick-btn" data-scope="current">
              <div class="size-pick-name">Current</div>
              <div class="size-pick-dim">1</div>
            </button>
            <button class="size-pick-btn" data-scope="range">
              <div class="size-pick-name">Range…</div>
              <div class="size-pick-dim"></div>
            </button>
          </div>
        </div>
        <div>
          <div class="field-label">Format</div>
          <div class="share-format-list">
            ${[{id:'pdf',label:'PDF',desc:'Vector, searchable text'},{id:'png',label:'PNG',desc:'One image per page'},{id:'note',label:'NoteBridge',desc:'Editable .nbnote bundle'}].map((f,i) => `
              <button class="share-format-btn${i===0?' active':''}" data-format="${f.id}">
                <div class="format-icon">${f.id.toUpperCase().slice(0,3)}</div>
                <div style="flex:1">
                  <div class="format-name">${f.label}</div>
                  <div class="format-desc">${f.desc}</div>
                </div>
                ${i===0?`<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="color:var(--sage)"><path d="M2.5 7.5l3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`:''}
              </button>`).join('')}
          </div>
        </div>
        <div>
          <div class="field-label">Options</div>
          <label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer">
            ${switchHTML('includebg', true)}
            <span style="font-size:13px;color:var(--ink)">Include paper template</span>
          </label>
        </div>
        <div class="share-link-row">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="color:var(--ink-mute)"><path d="M7 9.5a3 3 0 004.2 0l2-2a3 3 0 00-4.2-4.2l-1 1M9 6.5a3 3 0 00-4.2 0l-2 2a3 3 0 004.2 4.2l1-1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          <div class="share-link-text">notebridge.app/k/8f3a-${nb?.id||'nb'}</div>
          <button class="copy-btn" id="copy-link-btn">Copy link</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn-primary" id="modal-export">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right:4px"><path d="M3 11v2.5h10V11M8 2v8M8 2L5 5M8 2l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Export
        </button>
      </div>
    </div>`;
}

function bindShareModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-export')?.addEventListener('click', closeModal);
  document.querySelectorAll('.share-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.share-format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelectorAll('[data-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-scope]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  const copyBtn = document.getElementById('copy-link-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => { copyBtn.textContent = 'Copy link'; copyBtn.classList.remove('copied'); }, 1400);
    });
  }
  bindSwitch(document.getElementById('modal-container'), 'includebg', () => {});
}

// Connection modal
function connectionModalHTML() {
  const c = state.connected;
  const devices = [
    { name: "Kenneth's PC",   host: 'kenneth-pc.local',  online: true,  recent: true,  here: c },
    { name: 'Studio · Mac',   host: 'studio-mini.local', online: true,  recent: false, here: false },
    { name: 'Junn · Windows', host: 'junn-win.local',    online: false, recent: true,  here: false },
  ];
  const ipadIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="1.5" width="11" height="15" rx="1.5" stroke="currentColor" stroke-width="1.3"/><circle cx="9" cy="14.2" r=".7" fill="currentColor"/></svg>`;

  return `
    <div class="modal-panel" style="width:460px">
      <div class="modal-header">
        <div class="modal-header-text">
          <div class="modal-title">${c ? 'Connected' : 'Find a desktop'}</div>
          <div class="modal-subtitle">${c ? 'Your iPad is mirroring to a desktop NoteBridge window.' : 'Both devices must be on the same WiFi network.'}</div>
        </div>
        <button class="modal-close-btn" id="modal-close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>
      ${c ? `
      <div style="padding:20px 24px 4px">
        <div style="padding:16px;border-radius:12px;background:var(--sage-soft);border:0.5px solid rgba(92,112,88,0.25);display:flex;gap:14px;align-items:center">
          <div style="width:48px;height:48px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;color:var(--sage);position:relative;border:0.5px solid rgba(92,112,88,0.2)">
            ${ipadIcon.replace('width="18"','width="22"').replace('height="18"','height="22"')}
            <div style="position:absolute;bottom:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:var(--sage);border:2.5px solid var(--paper);display:flex;align-items:center;justify-content:center">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600;color:var(--ink);font-family:var(--font-display);font-style:italic;letter-spacing:-0.2px">${state.deviceName||"Kenneth's PC"}</div>
            <div style="font-size:11.5px;color:var(--ink-mute);margin-top:1px;font-family:var(--font-mono)">Local network · ${state.latency} ms</div>
          </div>
        </div>
        <div class="conn-stats">
          <div class="conn-stat"><div class="conn-stat-label">Latency</div><div class="conn-stat-value">${state.latency}<span style="font-size:10px;color:var(--ink-mute);margin-left:2px">ms</span></div></div>
          <div class="conn-stat"><div class="conn-stat-label">Frames</div><div class="conn-stat-value">30<span style="font-size:10px;color:var(--ink-mute);margin-left:2px">fps</span></div></div>
          <div class="conn-stat"><div class="conn-stat-label">Up</div><div class="conn-stat-value" style="font-size:15px">Active</div></div>
        </div>
        <button id="modal-disconnect" style="width:100%;margin-top:14px;padding:10px;background:transparent;border:0.5px solid var(--rule-strong);border-radius:8px;color:var(--red);font-size:13px;cursor:pointer;font-weight:500">Disconnect</button>
      </div>` : `
      <div style="padding:8px 24px 12px">
        <div class="scanning-pill"><span class="scanning-dot"></span>Searching local network…</div>
        <div class="device-list">
          ${devices.map((d,i) => `
            <div class="device-row${d.online?'':' offline'}" data-device="${i}">
              <div class="device-icon">${ipadIcon}</div>
              <div style="flex:1">
                <div class="device-name">${d.name}${d.recent?`<span class="device-badge">Recent</span>`:''}</div>
                <div class="device-host">${d.host}${!d.online?' · offline':''}</div>
              </div>
              ${d.online?`<svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="color:var(--ink-mute)"><path d="M4.5 2.5l3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`:''}
            </div>`).join('')}
        </div>
        <div style="margin-top:14px;display:flex;gap:8px">
          <button class="btn-secondary" style="flex:1;font-size:12.5px">Connect by IP…</button>
          <button class="btn-secondary" id="modal-offline" style="flex:1;font-size:12.5px">Use offline</button>
        </div>
      </div>`}
      <div class="conn-footer">Move your cursor off the right edge of your desktop screen to draw on this iPad — exactly like a second monitor.</div>
    </div>`;
}

function bindConnectionModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-offline')?.addEventListener('click', closeModal);
  document.getElementById('modal-disconnect')?.addEventListener('click', () => {
    Bridge.send('disconnect', {});
    closeModal();
  });
  document.querySelectorAll('.device-row:not(.offline)').forEach(row => {
    row.addEventListener('click', () => closeModal());
  });
}

// ── Bridge message handlers (ALL PRESERVED) ───────────────────

window.iPadPointerInput = (action, nx, ny, pressure) => {
  if (!engine) return;
  if      (action === 'down') engine.inputDown(nx, ny, pressure);
  else if (action === 'move') engine.inputMove(nx, ny, pressure);
  else if (action === 'up')   engine.inputUp(nx, ny, pressure);
};

Bridge.on('touch_event', ({ action, x, y, pressure }) => {
  if (!engine) return;
  if      (action === 'down') engine.inputDown(x, y, pressure);
  else if (action === 'move') engine.inputMove(x, y, pressure);
  else if (action === 'up')   engine.inputUp(x, y, pressure);
});

Bridge.on('page_state', data => {
  if (!engine) return;
  engine.loadPageState(data);
  updatePageUI();
});

Bridge.on('cursor_pos', data => {
  if (engine) engine.setCursor(data.x, data.y);
});

Bridge.on('undo', () => {
  if (!engine) return;
  const page = engine.pages[engine.currentPage];
  if (page.length > 0) {
    const s = page.pop();
    engine.redoStacks[engine.currentPage].push(s);
    engine.redraw();
  }
  updatePageUI();
});

Bridge.on('redo', () => {
  if (!engine) return;
  const stack = engine.redoStacks[engine.currentPage];
  if (stack.length > 0) {
    engine.pages[engine.currentPage].push(stack.pop());
    engine.redraw();
  }
  updatePageUI();
});

Bridge.on('tool_change', data => {
  if (!data?.tool) return;
  setTool(data.tool);
});

Bridge.on('color_change', data => {
  if (!data?.color) return;
  setColor(data.color);
  setTool('pen');
});

Bridge.on('size_change', data => {
  if (data?.size == null) return;
  setSize(Number(data.size));
});

Bridge.on('connection_status', data => {
  state.connected  = !!(data && data.connected);
  state.deviceName = (data && data.deviceName) || '';
  state.latency    = (data && data.latency) || 0;
  updateStatusPills();

  const pill     = document.getElementById('connection-pill');
  const pillDev  = document.getElementById('cpill-device');
  const pillLat  = document.getElementById('cpill-latency');
  if (state.connected) {
    if (pillDev) pillDev.textContent = state.deviceName || 'Desktop PC';
    if (pillLat) pillLat.textContent = state.latency ? ` ${state.latency} ms` : '';
    if (pill) pill.classList.remove('hidden');
  } else {
    if (pill) pill.classList.add('hidden');
  }
});

Bridge.on('set_title', data => {
  if (!data?.title) return;
  const nameEl = document.getElementById('nb-name');
  if (nameEl) nameEl.textContent = data.title;
  // Also update current notebook in state
  if (state.notebookId) {
    const nb = state.notebooks.find(n => n.id === state.notebookId);
    if (nb) nb.title = data.title;
  }
});

// ── Event binding ─────────────────────────────────────────────

function bindEvents() {
  // Toolbar: tool buttons
  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });

  // Undo / Redo
  document.getElementById('btn-undo')?.addEventListener('click', () => engine?.undo());
  document.getElementById('btn-redo')?.addEventListener('click', () => engine?.redo());

  // Keyboard shortcuts
  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); engine?.undo(); }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); engine?.redo(); }
    if (e.key === 'Escape') { closePenWell(); closeModal(); }
  });

  // Page navigation
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    if (engine) { engine.switchPage(engine.currentPage - 1); updatePageUI(); }
  });
  document.getElementById('btn-next')?.addEventListener('click', () => {
    if (engine) { engine.switchPage(engine.currentPage + 1); updatePageUI(); }
  });
  document.getElementById('btn-add-page')?.addEventListener('click', () => {
    if (engine) { engine.addPage(); updatePageUI(); }
  });

  // Top bar: back to library
  document.getElementById('btn-back')?.addEventListener('click', () => showScreen('library'));

  // Top bar: pages overview
  document.getElementById('btn-pages')?.addEventListener('click', () => openModal('pages'));

  // Top bar: share
  document.getElementById('btn-share')?.addEventListener('click', () => openModal('share'));

  // Top bar: bookmark
  document.getElementById('btn-bookmark')?.addEventListener('click', () => {
    if (!state.notebookId || !engine) return;
    const page = engine.currentPage + 1;
    const bm   = state.bookmarked[state.notebookId] || {};
    bm[page]   = !bm[page];
    state.bookmarked[state.notebookId] = bm;
    const btn  = document.getElementById('btn-bookmark');
    if (btn) btn.classList.toggle('bookmark-on', !!bm[page]);
  });

  // Status pills → connection modal
  document.querySelectorAll('.status-pill').forEach(pill => {
    pill.addEventListener('click', () => openModal('connection'));
  });

  // Connection pill dismiss
  document.getElementById('cpill-dismiss')?.addEventListener('click', () => {
    document.getElementById('connection-pill')?.classList.add('hidden');
    Bridge.send('disconnect', {});
  });

  // Pen well trigger
  document.getElementById('pen-well-trigger')?.addEventListener('click', e => {
    e.stopPropagation();
    state.penWellOpen ? closePenWell() : openPenWell();
  });

  // Click outside pen well to close
  document.addEventListener('click', () => {
    if (state.penWellOpen) closePenWell();
    if (state.activeMenu) { state.activeMenu = null; renderLibrary(); }
  });
  document.getElementById('floating-toolbar')?.addEventListener('click', e => e.stopPropagation());

  // Library view toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.libView = btn.dataset.view;
      renderLibrary();
    });
  });

  // Library search
  document.getElementById('lib-search-input')?.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    renderLibrary();
  });

  // Library: new notebook button (hero)
  document.getElementById('lib-new-btn')?.addEventListener('click', () => openModal('new'));

  // Library: settings button
  document.getElementById('lib-settings-btn')?.addEventListener('click', () => showScreen('settings'));

  // Settings nav
  document.querySelectorAll('.snav-btn').forEach(btn => {
    btn.addEventListener('click', () => renderSettingsSection(btn.dataset.section));
  });

  // Settings done
  document.getElementById('btn-settings-done')?.addEventListener('click', () => {
    showScreen(state.notebookId ? 'canvas' : 'library');
  });
}

// ── Init ──────────────────────────────────────────────────────

(function init() {
  const isElectron = !!window.__electronIPCBridge;

  if (isElectron) {
    document.getElementById('app').classList.add('electron-mode');
    initCanvas();
    showScreen('canvas');
  } else {
    initPenWell();
    setTool('pen');
    renderLibrary();
    showScreen('library');
  }

  bindEvents();
  updateStatusPills();

  // When pen well is lazily shown after engine init (Electron mode doesn't need it)
  if (!isElectron) {
    initPenWell();
  }

  Bridge.send('request_state', {});
  Bridge.send('ready', {});
})();
