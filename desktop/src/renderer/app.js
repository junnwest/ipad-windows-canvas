// Initialize tool state, canvas renderer, notebook manager, and UI helpers
const toolState       = new ToolState();
const canvasEl        = document.getElementById('canvas');
const renderer        = new CanvasRenderer(canvasEl, toolState);
const notebookManager = new NotebookManager(renderer);
const notebookListUI  = new NotebookListUI();
const pageSetupUI     = new PageSetupUI();
const pagesOverviewUI = new PagesOverviewUI(notebookManager);

// --- Save state ---
let isDirty  = false;
let saveTimer = null;
const saveStatusEl = document.getElementById('save-status');

function setSaveStatus(text) { saveStatusEl.textContent = text; }

function markDirty() {
  if (!isDirty) { isDirty = true; setSaveStatus('Unsaved changes'); }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => autoSave(), 2000);
}

function clearDirty() {
  if (saveTimer) clearTimeout(saveTimer);
  isDirty = false;
  setSaveStatus('');
}

async function autoSave() {
  if (!notebookManager.notebook || !isDirty) return;
  if (!window.electronAPI) return;
  const notebook = notebookManager.getExportData();
  setSaveStatus('Saving...');
  try {
    await window.electronAPI.saveNotebook(notebook);
    isDirty = false;
    setSaveStatus('Saved');
    setTimeout(() => { if (!isDirty) setSaveStatus(''); }, 2000);
  } catch (err) {
    setSaveStatus('Save failed');
  }
}

// --- Notebook title in toolbar ---
function updateNotebookTitle(name) {
  document.getElementById('notebook-name').textContent = name ? '\u2014 ' + name : '';
}

// --- Notebooks button → list modal ---
document.getElementById('notebooks-btn').addEventListener('click', async () => {
  if (!window.electronAPI) return;
  const notebooks = await window.electronAPI.listNotebooks();
  const currentId = notebookManager.notebook ? notebookManager.notebook.id : null;
  notebookListUI.open(notebooks, currentId);
});

// "New Notebook" in list modal → page setup
notebookListUI.onNewClick = () => {
  notebookListUI.close();
  pageSetupUI.show({
    mode: 'notebook',
    onConfirm: async ({ name, pageSize, template }) => {
      if (isDirty) await autoSave();
      const notebook = await window.electronAPI.createNotebook(name, pageSize, template);
      notebookManager.loadNotebook(notebook);
      clearDirty();
      updateNotebookTitle(notebook.name);
    },
  });
};

notebookListUI.onOpen = async (id) => {
  if (notebookManager.notebook && notebookManager.notebook.id === id) {
    notebookListUI.close();
    return;
  }
  notebookListUI.close();
  if (isDirty) await autoSave();
  const notebook = await window.electronAPI.loadNotebook(id);
  if (notebook) {
    notebookManager.loadNotebook(notebook);
    clearDirty();
    updateNotebookTitle(notebook.name);
  }
};

notebookListUI.onRename = async (id, newName) => {
  await window.electronAPI.renameNotebook(id, newName);
  if (notebookManager.notebook && notebookManager.notebook.id === id) {
    notebookManager.notebook.name = newName;
    updateNotebookTitle(newName);
  }
  const notebooks = await window.electronAPI.listNotebooks();
  const currentId = notebookManager.notebook ? notebookManager.notebook.id : null;
  notebookListUI._currentId = currentId;
  notebookListUI.render(notebooks);
};

notebookListUI.onDelete = async (id) => {
  const isDeletingCurrent = notebookManager.notebook && notebookManager.notebook.id === id;
  await window.electronAPI.deleteNotebook(id);
  const notebooks = await window.electronAPI.listNotebooks();

  if (isDeletingCurrent) {
    let notebook;
    if (notebooks.length > 0) {
      notebook = await window.electronAPI.loadNotebook(notebooks[0].id);
    } else {
      notebook = await window.electronAPI.createNotebook('Untitled', DEFAULT_PAGE_SIZE, DEFAULT_TEMPLATE);
    }
    notebookManager.loadNotebook(notebook);
    clearDirty();
    updateNotebookTitle(notebook.name);
    const refreshed = await window.electronAPI.listNotebooks();
    notebookListUI._currentId = notebook.id;
    notebookListUI.render(refreshed);
  } else {
    const currentId = notebookManager.notebook ? notebookManager.notebook.id : null;
    notebookListUI._currentId = currentId;
    notebookListUI.render(notebooks);
  }
};

// --- Tool bar: pen/eraser toggle ---
const toolBtns = document.querySelectorAll('#tool-selector .tool-btn');
toolBtns.forEach((btn) => {
  btn.addEventListener('click', () => toolState.setTool(btn.dataset.tool));
});

// --- Color palette ---
const colorPalette = document.getElementById('color-palette');
toolState.colors.forEach((color) => {
  const swatch = document.createElement('div');
  swatch.className = 'color-swatch' + (color === toolState.currentColor ? ' active' : '');
  swatch.style.background = color;
  swatch.dataset.color = color;
  swatch.addEventListener('click', () => toolState.setColor(color));
  colorPalette.appendChild(swatch);
});

// --- Size selector ---
const sizeSelector = document.getElementById('size-selector');
toolState.sizes.forEach((size) => {
  const btn = document.createElement('button');
  btn.className = 'size-btn' + (size === toolState.currentSize ? ' active' : '');
  btn.dataset.size = size;
  const dot = document.createElement('span');
  dot.className = 'size-dot';
  const dotSize = Math.max(4, size * 3);
  dot.style.width  = dotSize + 'px';
  dot.style.height = dotSize + 'px';
  btn.appendChild(dot);
  btn.addEventListener('click', () => toolState.setSize(size));
  sizeSelector.appendChild(btn);
});

function updateToolUI() {
  toolBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === toolState.currentTool);
  });
  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.classList.toggle('active', swatch.dataset.color === toolState.currentColor);
  });
  document.querySelectorAll('.size-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.size) === toolState.currentSize);
  });
  canvasEl.classList.toggle('eraser-cursor', toolState.currentTool === 'eraser');
}

toolState.onChange = updateToolUI;

// --- Undo / Redo ---
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

function updateHistoryButtons() {
  undoBtn.disabled = !renderer.canUndo();
  redoBtn.disabled = !renderer.canRedo();
  markDirty();
}

renderer.onHistoryChange = updateHistoryButtons;
undoBtn.addEventListener('click', () => renderer.undo());
redoBtn.addEventListener('click', () => renderer.redo());

// --- Page navigation ---
const pageIndicator = document.getElementById('page-indicator');
const prevPageBtn   = document.getElementById('prev-page-btn');
const nextPageBtn   = document.getElementById('next-page-btn');
const addPageBtn    = document.getElementById('add-page-btn');
const addPageDropBtn = document.getElementById('add-page-dropdown-btn');

function updatePageUI(currentIndex, pageCount) {
  pageIndicator.textContent = `Page ${currentIndex + 1} / ${pageCount}`;
  prevPageBtn.disabled = currentIndex === 0;
  nextPageBtn.disabled = currentIndex === pageCount - 1;
  pagesOverviewUI.refresh();
  if (window.electronAPI) {
    window.electronAPI.sendToiPad({ type: 'page_state', currentPage: currentIndex, pageCount });
  }
}

notebookManager.onPageChange = updatePageUI;

prevPageBtn.addEventListener('click', () => {
  notebookManager.switchToPage(notebookManager.currentPageIndex - 1);
});
nextPageBtn.addEventListener('click', () => {
  notebookManager.switchToPage(notebookManager.currentPageIndex + 1);
});

// Add Page (quick): use last page's config, no dialog
addPageBtn.addEventListener('click', () => {
  if (!notebookManager.notebook) return;
  const pages = notebookManager.notebook.pages;
  const lastPage = pages[pages.length - 1];
  notebookManager.addPage({
    pageSize: lastPage ? (lastPage.pageSize || DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
    template: lastPage ? (lastPage.template || DEFAULT_TEMPLATE)  : DEFAULT_TEMPLATE,
  });
  markDirty();
});

// Add Page (dropdown ▾): open page setup dialog for custom config
addPageDropBtn.addEventListener('click', () => {
  if (!notebookManager.notebook) return;
  const pages = notebookManager.notebook.pages;
  const lastPage = pages[pages.length - 1];
  pageSetupUI.show({
    mode: 'page',
    defaults: {
      pageSize: lastPage ? (lastPage.pageSize || DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
      template: lastPage ? (lastPage.template || DEFAULT_TEMPLATE)  : DEFAULT_TEMPLATE,
    },
    onConfirm: ({ pageSize, template }) => {
      notebookManager.addPage({ pageSize, template });
      markDirty();
    },
  });
});

// --- Pages overview ---
document.getElementById('pages-btn').addEventListener('click', () => {
  if (!notebookManager.notebook) return;
  pagesOverviewUI.open();
});

// "Add Page" inside the pages overview → same dropdown flow as above
pagesOverviewUI.onAddPage = () => {
  if (!notebookManager.notebook) return;
  const pages = notebookManager.notebook.pages;
  const lastPage = pages[pages.length - 1];
  pageSetupUI.show({
    mode: 'page',
    defaults: {
      pageSize: lastPage ? (lastPage.pageSize || DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
      template: lastPage ? (lastPage.template || DEFAULT_TEMPLATE)  : DEFAULT_TEMPLATE,
    },
    onConfirm: ({ pageSize, template }) => {
      notebookManager.addPage({ pageSize, template });
      markDirty();
    },
  });
};

pagesOverviewUI.onStructureChange = () => markDirty();

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); renderer.undo();
  } else if (e.ctrlKey && (e.key === 'Z' || e.key === 'y')) {
    e.preventDefault(); renderer.redo();
  } else if (e.ctrlKey && e.key === 's') {
    e.preventDefault(); autoSave();
  } else if (e.key === 'p' || e.key === 'P') {
    toolState.setTool('pen');
  } else if (e.key === 'e' || e.key === 'E') {
    toolState.setTool('eraser');
  }
});

// --- Clear current page ---
document.getElementById('clear-btn').addEventListener('click', () => {
  renderer.clear();
});

// --- Export PDF ---
document.getElementById('export-pdf-btn').addEventListener('click', async () => {
  if (!notebookManager.notebook || !window.electronAPI) return;
  const notebookData = notebookManager.getExportData();
  setSaveStatus('Exporting\u2026');
  const result = await window.electronAPI.exportPDF(notebookData);
  if (result && result.success) {
    setSaveStatus('PDF exported');
    setTimeout(() => { if (!isDirty) setSaveStatus(''); }, 3000);
  } else {
    setSaveStatus(result && result.error ? 'Export failed' : '');
  }
});

// --- Save before window closes ---
window.addEventListener('beforeunload', () => {
  if (isDirty && notebookManager.notebook && window.electronAPI) {
    window.electronAPI.saveNotebook(notebookManager.getExportData());
  }
});

// --- iPad connection ---
if (window.electronAPI) {
  window.electronAPI.onStrokeUpdate((strokeData) => {
    renderer.handleStrokeUpdate(strokeData);
  });
  window.electronAPI.onStrokeComplete((strokeId) => {
    renderer.handleStrokeComplete(strokeId);
  });

  window.electronAPI.onIPadUndo(()        => renderer.undo());
  window.electronAPI.onIPadRedo(()        => renderer.redo());
  window.electronAPI.onIPadEraseAt(({ x, y }) => renderer.handleEraseAt(x, y));

  window.electronAPI.onIPadPageSwitch((index) => {
    notebookManager.switchToPage(index);
  });
  window.electronAPI.onIPadPageAdd(() => {
    notebookManager.addPage(); // uses current page's size/template as defaults
  });

  window.electronAPI.onConnectionStatus((status) => {
    const el = document.getElementById('connection-status');
    if (status.connected) {
      el.textContent = `iPad Connected (${status.deviceName || 'unknown'})`;
      el.className = 'status-connected';
      window.electronAPI.sendToiPad({
        type: 'page_state',
        currentPage: notebookManager.currentPageIndex,
        pageCount:   notebookManager.pageCount,
      });
    } else {
      el.textContent = 'No iPad Connected';
      el.className = 'status-disconnected';
    }
  });

  window.electronAPI.onNotebookLoaded((notebook) => {
    notebookManager.loadNotebook(notebook);
    clearDirty();
    updateNotebookTitle(notebook.name);
  });
}
