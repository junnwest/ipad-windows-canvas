// Initialize the canvas renderer
const canvasEl = document.getElementById('canvas');
const renderer = new CanvasRenderer(canvasEl);

// Clear button
document.getElementById('clear-btn').addEventListener('click', () => {
  renderer.clear();
});

// Listen for stroke data from main process (iPad connection)
if (window.electronAPI) {
  window.electronAPI.onStrokeUpdate((strokeData) => {
    renderer.handleStrokeUpdate(strokeData);
  });

  window.electronAPI.onConnectionStatus((status) => {
    const el = document.getElementById('connection-status');
    if (status.connected) {
      el.textContent = `iPad Connected (${status.deviceName || 'unknown'})`;
      el.className = 'status-connected';
    } else {
      el.textContent = 'No iPad Connected';
      el.className = 'status-disconnected';
    }
  });
}
