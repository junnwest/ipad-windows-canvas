const { app, BrowserWindow, ipcMain, dialog, nativeImage, screen } = require('electron');
const path = require('path');
const logger = require('./utils/logger');
const DiscoveryService = require('./services/discovery');
const CanvasServer = require('./services/websocket');
const StorageService = require('./services/storage');
const ExportService = require('./services/export');
const CaptureService = require('./services/capture');

// iPad view window dimensions — iPad Pro 12.9" landscape at logical 1x resolution
const IPAD_VIEW_W = 1366;
const IPAD_VIEW_H = 1024;

let mainWindow = null;
let ipadWindow = null;   // hidden window that renders the shared web app and is streamed to iPad
let captureService = null;
let storage = null;
const discovery = new DiscoveryService();
const server = new CanvasServer();
const exporter = new ExportService();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'NoteBridge',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  logger.info('Main window created');
}

// Creates the hidden iPad view window that renders the shared web app.
// This window is never shown to the Windows user — its content is captured
// and streamed to the iPad as MJPEG frames.
function createIPadWindow() {
  ipadWindow = new BrowserWindow({
    width: IPAD_VIEW_W,
    height: IPAD_VIEW_H,
    show: false,   // never shown on Windows
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-ipad.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Allow pointer events to be synthesized from touch_event messages
      backgroundThrottling: false,
    },
  });

  ipadWindow.loadFile(path.join(__dirname, '..', '..', 'shared', 'index.html'));

  ipadWindow.webContents.on('did-finish-load', () => {
    logger.info('iPad view window loaded');
  });

  ipadWindow.on('closed', () => {
    ipadWindow = null;
    if (captureService) captureService.stop();
  });

  // Start capture service — streams the hidden window to connected iPads
  captureService = new CaptureService(ipadWindow, server);
  captureService.start();

  logger.info('iPad view window created');
}

// Sends cursor position to both the iPad (WebSocket broadcast) and the hidden
// Electron window (so the cursor is drawn into the captured MJPEG frames).
function sendCursorUpdate(x, y) {
  server.broadcast({ type: 'cursor_pos', x, y });
  if (ipadWindow && !ipadWindow.isDestroyed()) {
    ipadWindow.webContents.executeJavaScript(
      `window.bridgeReceive && window.bridgeReceive('cursor_pos', ${JSON.stringify({ x, y })})`
    ).catch(() => {});
  }
}

// Phase 1a cursor detection: polls Windows cursor position and activates
// "iPad mode" when the cursor reaches the right edge of the primary display.
// Phase 1b will add proper cursor locking (keeping the cursor frozen at the
// edge so the user can navigate across the full iPad surface).
function startCursorPolling() {
  let iPadMode = false;

  setInterval(() => {
    if (!ipadWindow || ipadWindow.isDestroyed()) return;
    if (server.clientCount() === 0) return;

    const pt = screen.getCursorScreenPoint();
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;

    if (!iPadMode && pt.x >= width - 2) {
      iPadMode = true;
      sendCursorUpdate(0, pt.y / height);
      logger.debug('Cursor entered iPad mode');
    } else if (iPadMode) {
      sendCursorUpdate(0, pt.y / height);
      if (pt.x < width - 20) {
        iPadMode = false;
        sendCursorUpdate(-1, -1); // hide cursor
        logger.debug('Cursor exited iPad mode');
      }
    }
  }, 16);
}

function startServices() {
  // Start WebSocket server
  server.onStrokeUpdate = (strokeData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('stroke-update', strokeData);
    }
  };

  server.onStrokeComplete = (strokeId) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('stroke-complete', strokeId);
    }
  };

  server.onUndo = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ipad-undo');
    }
  };

  server.onRedo = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ipad-redo');
    }
  };

  server.onEraseAt = (x, y) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ipad-erase-at', { x, y });
    }
  };

  server.onPageSwitch = (index) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ipad-page-switch', index);
    }
  };

  server.onPageAdd = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ipad-page-add');
    }
  };

  server.onClientChange = (count, deviceInfo) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('connection-status', {
        connected: count > 0,
        clientCount: count,
        deviceName: deviceInfo || '',
      });
    }
  };

  // ── Phase 1: touch_event — forward iPad pointer input to the hidden window ──
  // The iPad sends normalized (0–1) coordinates; we scale to the hidden
  // window's logical pixel dimensions and inject as synthetic mouse events.
  server.onTouchEvent = (event) => {
    if (!ipadWindow || ipadWindow.isDestroyed()) return;

    const x = Math.round(event.x * IPAD_VIEW_W);
    const y = Math.round(event.y * IPAD_VIEW_H);

    switch (event.action) {
      case 'down':
        ipadWindow.webContents.sendInputEvent({
          type: 'mouseDown', x, y, button: 'left', clickCount: 1,
        });
        break;
      case 'move':
        ipadWindow.webContents.sendInputEvent({ type: 'mouseMove', x, y });
        break;
      case 'up':
        ipadWindow.webContents.sendInputEvent({
          type: 'mouseUp', x, y, button: 'left', clickCount: 1,
        });
        break;
    }
  };

  // ── Phase 1: action — forward toolbar / page commands to hidden window ──
  server.onAction = (action, payload) => {
    if (!ipadWindow || ipadWindow.isDestroyed()) return;
    // Use bridgeReceive so the shared web app handles it natively
    ipadWindow.webContents.executeJavaScript(
      `window.bridgeReceive && window.bridgeReceive(${JSON.stringify(action)}, ${JSON.stringify(payload)})`
    ).catch(() => {});
  };

  server.start();

  // Start mDNS broadcast so iPads can discover us
  discovery.start();
}

function stopServices() {
  if (captureService) captureService.stop();
  discovery.stop();
  server.stop();
}

app.whenReady().then(async () => {
  storage = new StorageService();
  createWindow();
  createIPadWindow();
  startServices();
  startCursorPolling();

  // Load or create default notebook, send to renderer when ready
  mainWindow.webContents.on('did-finish-load', async () => {
    const notebooks = await storage.listNotebooks();
    let notebook;
    if (notebooks.length > 0) {
      notebook = await storage.loadNotebook(notebooks[0].id);
    } else {
      notebook = storage.createNotebook('Untitled', 'a4-landscape', 'blank');
      await storage.saveNotebook(notebook);
    }
    mainWindow.webContents.send('notebook-loaded', notebook);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  stopServices();
});

ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
  };
});

// Renderer can send messages to iPad via this channel
ipcMain.on('send-to-ipad', (_event, data) => {
  server.broadcast(data);
});

// Storage IPC handlers
ipcMain.handle('save-notebook', async (_event, notebook) => {
  await storage.saveNotebook(notebook);
  return true;
});

ipcMain.handle('load-notebook', async (_event, id) => {
  return await storage.loadNotebook(id);
});

ipcMain.handle('list-notebooks', async () => {
  return await storage.listNotebooks();
});

ipcMain.handle('create-notebook', async (_event, { name, pageSize, template }) => {
  const notebook = storage.createNotebook(name, pageSize, template);
  await storage.saveNotebook(notebook);
  return notebook;
});

ipcMain.handle('rename-notebook', async (_event, { id, newName }) => {
  await storage.renameNotebook(id, newName);
  return true;
});

ipcMain.handle('delete-notebook', async (_event, id) => {
  await storage.deleteNotebook(id);
  return true;
});

// Image insertion
ipcMain.handle('insert-image', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Insert Image',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths || !filePaths[0]) return null;

  let img = nativeImage.createFromPath(filePaths[0]);
  if (img.isEmpty()) return null;

  // Downscale to max 1 200 px on the longest side to keep file sizes manageable
  const { width, height } = img.getSize();
  const MAX = 1200;
  if (width > MAX || height > MAX) {
    const scale = MAX / Math.max(width, height);
    img = img.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
  }

  const buf = img.toJPEG(85);
  const src = 'data:image/jpeg;base64,' + buf.toString('base64');
  const finalSize = img.getSize();
  return { src, width: finalSize.width, height: finalSize.height };
});

// PDF export
ipcMain.handle('export-pdf', async (_event, notebookData) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export PDF',
    defaultPath: `${notebookData.name || 'notebook'}.pdf`,
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) return { success: false };

  try {
    await exporter.exportToPDF(notebookData, filePath);
    return { success: true, filePath };
  } catch (err) {
    logger.error('PDF export failed:', err.message);
    return { success: false, error: err.message };
  }
});
