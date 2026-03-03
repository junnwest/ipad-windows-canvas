const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const logger = require('./utils/logger');
const DiscoveryService = require('./services/discovery');
const CanvasServer = require('./services/websocket');
const StorageService = require('./services/storage');
const ExportService = require('./services/export');

let mainWindow = null;
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

  server.start();

  // Start mDNS broadcast so iPads can discover us
  discovery.start();
}

function stopServices() {
  discovery.stop();
  server.stop();
}

app.whenReady().then(async () => {
  storage = new StorageService();
  createWindow();
  startServices();

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
