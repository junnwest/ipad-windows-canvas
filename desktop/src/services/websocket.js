const WebSocket = require('ws');
const config = require('../utils/config');
const logger = require('../utils/logger');

class CanvasServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();

    // ── Phase 0 callbacks (legacy stroke protocol) ──────────────
    this.onStrokeUpdate = null;    // (strokeData) => void
    this.onStrokeComplete = null;  // (strokeId) => void
    this.onUndo = null;            // () => void
    this.onRedo = null;            // () => void
    this.onEraseAt = null;         // (x, y) => void
    this.onPageSwitch = null;      // (index) => void
    this.onPageAdd = null;         // () => void
    this.onClientChange = null;    // (count, deviceName) => void

    // ── Phase 1 callbacks (second-screen protocol) ───────────────
    // iPad sends pointer/touch input: { action, x, y, pressure, tool }
    this.onTouchEvent = null;      // (event) => void
    // iPad sends toolbar/page actions: { action, ...payload }
    this.onAction = null;          // (action, payload) => void
  }

  start(port = config.WEBSOCKET_PORT) {
    this.wss = new WebSocket.Server({ port });

    this.wss.on('listening', () => {
      logger.info(`WebSocket server listening on port ${port}`);
    });

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      logger.info(`iPad connected from ${clientIp}`);
      this.clients.add(ws);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        deviceName: require('os').hostname(),
        version: config.VERSION,
        timestamp: Date.now(),
      }));

      if (this.onClientChange) {
        this.onClientChange(this.clients.size, clientIp);
      }

      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });

      ws.on('close', () => {
        logger.info(`iPad disconnected (${clientIp})`);
        this.clients.delete(ws);
        if (this.onClientChange) {
          this.onClientChange(this.clients.size, null);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket client error:', error.message);
        this.clients.delete(ws);
      });
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error.message);
    });
  }

  handleMessage(ws, raw) {
    try {
      const message = JSON.parse(raw);

      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: message.timestamp,
          }));
          break;

        case 'stroke_update':
          if (this.onStrokeUpdate && message.stroke) {
            this.onStrokeUpdate(message.stroke);
          }
          break;

        case 'stroke_complete':
          if (this.onStrokeComplete && message.strokeId) {
            this.onStrokeComplete(message.strokeId);
          }
          break;

        case 'undo':
          if (this.onUndo) this.onUndo();
          break;

        case 'redo':
          if (this.onRedo) this.onRedo();
          break;

        case 'erase_at':
          if (this.onEraseAt && message.x != null && message.y != null) {
            this.onEraseAt(message.x, message.y);
          }
          break;

        case 'page_switch':
          if (this.onPageSwitch && message.page != null) {
            this.onPageSwitch(message.page);
          }
          break;

        case 'page_add':
          if (this.onPageAdd) this.onPageAdd();
          break;

        // ── Phase 1: second-screen input ──────────────────────────
        // touch_event: pointer/touch/pencil input from the iPad screen
        // { type, action: 'down'|'move'|'up', x, y, pressure, tool }
        case 'touch_event':
          if (this.onTouchEvent) {
            this.onTouchEvent(message);
          }
          break;

        // action: toolbar and page commands sent from the iPad app UI
        // { type, action: 'undo'|'redo'|'page_switch'|'page_add', ...payload }
        case 'action':
          if (this.onAction) {
            this.onAction(message.action, message);
          }
          // Also map to legacy callbacks for backward compatibility
          if (message.action === 'undo' && this.onUndo) this.onUndo();
          if (message.action === 'redo' && this.onRedo) this.onRedo();
          if (message.action === 'page_switch' && this.onPageSwitch) this.onPageSwitch(message.page);
          if (message.action === 'page_add' && this.onPageAdd) this.onPageAdd();
          break;

        default:
          logger.debug('Unknown message type:', message.type);
      }
    } catch (error) {
      logger.error('Message parse error:', error.message);
    }
  }

  clientCount() {
    return this.clients.size;
  }

  broadcast(data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  stop() {
    if (this.wss) {
      this.clients.forEach((client) => client.close());
      this.clients.clear();
      this.wss.close(() => {
        logger.info('WebSocket server stopped');
      });
      this.wss = null;
    }
  }
}

module.exports = CanvasServer;
