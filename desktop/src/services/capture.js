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
    this._pendingCapture = false;
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

  // Called on touch input to skip the timer wait and capture immediately.
  // No-ops if a capture is already in flight.
  captureNow() {
    if (!this._running || this.wsServer.clientCount() === 0) return;
    if (this._capturing) {
      this._pendingCapture = true;
      return;
    }
    clearTimeout(this._timer);
    this._timer = null;
    this._capture();
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
      const t0 = Date.now();
      const image = await this.ipadWindow.webContents.capturePage();
      const t1 = Date.now();
      const jpeg = image.toJPEG(this.quality);
      const t2 = Date.now();
      const base64 = jpeg.toString('base64');
      const t3 = Date.now();
      const { width, height } = image.getSize();

      console.log(`[capture] capturePage=${t1-t0}ms  toJPEG=${t2-t1}ms  base64=${t3-t2}ms  size=${width}x${height}  bytes=${jpeg.length}`);

      this.wsServer.broadcast({
        type: 'screen_frame',
        data: base64,
        width,
        height,
        capturedAt: t0,
      });
    } catch {
      // Window may have been destroyed — stop gracefully
      this.stop();
    } finally {
      this._capturing = false;
      if (this._pendingCapture) {
        this._pendingCapture = false;
        this._capture();
      } else {
        this._schedule();
      }
    }
  }
}

module.exports = CaptureService;
