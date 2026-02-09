const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Future: receive stroke data from main process
  onStrokeUpdate: (callback) => {
    ipcRenderer.on('stroke-update', (_event, data) => callback(data));
  },

  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (_event, data) => callback(data));
  },
});
