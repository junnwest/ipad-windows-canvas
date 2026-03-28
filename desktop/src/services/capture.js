'use strict';

// CaptureService
//
// Captures the hidden iPad view window at a target FPS and broadcasts
// each frame as a base64 JPEG over WebSocket to connected iPad clients.
//
// Uses Electron's webContents.capturePage() — no extra dependencies needed.
// Frame capture is self-throttling: if a capture takes longer than the frame
// budget, the next frame is skipped rather than queued.

class CaptureService {
  constructor(ipadWindow, wsServer, options = {}) {
    this.ipadWindow = ipadWindow;
    this.wsServer = wsServer;
    this.fps = options.fps || 30;
    this.quality = options.quality || 65; // JPEG quality 0–100

    this._running = false;
    this._capturing = false;
    this._timer = null;
    this._frameInterval = Math.round(1000 / this.fps);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._schedule();
  }

  stop() {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _schedule() {
    if (!this._running) return;
    this._timer = setTimeout(() => this._capture(), this._frameInterval);
  }

  async _capture() {
    if (!this._running) return;

    // Skip frame if previous capture hasn't finished or nobody is watching
    if (this._capturing || this.wsServer.clientCount() === 0) {
      this._schedule();
      return;
    }

    this._capturing = true;
    try {
      const image = await this.ipadWindow.webContents.capturePage();
      const jpeg = image.toJPEG(this.quality);
      const base64 = jpeg.toString('base64');
      const { width, height } = image.getSize();

      this.wsServer.broadcast({
        type: 'screen_frame',
        data: base64,
        width,
        height,
      });
    } catch {
      // Window may have been destroyed — stop gracefully
      this.stop();
    } finally {
      this._capturing = false;
      this._schedule();
    }
  }
}

module.exports = CaptureService;
