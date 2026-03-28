'use strict';

// Preload for the hidden iPad view window.
// Exposes a minimal IPC bridge to the shared web app under window.__electronIPCBridge.
// This is separate from preload.js (which serves the Windows app window).

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__electronIPCBridge', {

  // web app → main process
  send(type, data) {
    ipcRenderer.send('ipad-view:' + type, data);
  },

  // main process → web app (host pushes state/events down)
  // The host calls bridgeReceive(type, data) via executeJavaScript,
  // so this listener is a fallback for IPC-based pushes.
  onMessage(callback) {
    ipcRenderer.on('ipad-view-message', (_event, type, data) => {
      callback(type, data);
    });
  },
});
