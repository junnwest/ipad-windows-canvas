const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Stroke data from iPad
  onStrokeUpdate: (callback) => {
    ipcRenderer.on('stroke-update', (_event, data) => callback(data));
  },
  onStrokeComplete: (callback) => {
    ipcRenderer.on('stroke-complete', (_event, strokeId) => callback(strokeId));
  },

  // iPad commands (undo, redo, erase)
  onIPadUndo: (callback) => {
    ipcRenderer.on('ipad-undo', () => callback());
  },
  onIPadRedo: (callback) => {
    ipcRenderer.on('ipad-redo', () => callback());
  },
  onIPadEraseAt: (callback) => {
    ipcRenderer.on('ipad-erase-at', (_event, data) => callback(data));
  },
  onIPadPageSwitch: (callback) => {
    ipcRenderer.on('ipad-page-switch', (_event, index) => callback(index));
  },
  onIPadPageAdd: (callback) => {
    ipcRenderer.on('ipad-page-add', () => callback());
  },

  // Connection status
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (_event, data) => callback(data));
  },

  // Send message to iPad
  sendToiPad: (data) => {
    ipcRenderer.send('send-to-ipad', data);
  },

  // Storage
  saveNotebook: (notebook) => ipcRenderer.invoke('save-notebook', notebook),
  loadNotebook: (id) => ipcRenderer.invoke('load-notebook', id),
  listNotebooks: () => ipcRenderer.invoke('list-notebooks'),
  createNotebook: (name, pageSize, template) => ipcRenderer.invoke('create-notebook', { name, pageSize, template }),
  renameNotebook: (id, newName) => ipcRenderer.invoke('rename-notebook', { id, newName }),
  deleteNotebook: (id) => ipcRenderer.invoke('delete-notebook', id),

  // Notebook loaded on startup
  onNotebookLoaded: (callback) => {
    ipcRenderer.on('notebook-loaded', (_event, notebook) => callback(notebook));
  },

  // PDF export
  exportPDF: (notebookData) => ipcRenderer.invoke('export-pdf', notebookData),
});
