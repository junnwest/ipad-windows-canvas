const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const logger = require('./utils/logger');
const DiscoveryService = require('./services/discovery');
const CanvasServer = require('./services/websocket');

let mainWindow = null;
const discovery = new DiscoveryService();
const server = new CanvasServer();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'iPad Canvas Desktop',
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

app.whenReady().then(() => {
  createWindow();
  startServices();

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
