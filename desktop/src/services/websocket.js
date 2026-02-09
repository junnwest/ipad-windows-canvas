const WebSocket = require('ws');
const config = require('../utils/config');
const logger = require('../utils/logger');

class CanvasServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.onStrokeUpdate = null;   // callback: (strokeData) => void
    this.onClientChange = null;   // callback: (count, deviceName) => void
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
          // Future: finalize stroke in storage
          logger.debug('Stroke complete:', message.strokeId);
          break;

        default:
          logger.debug('Unknown message type:', message.type);
      }
    } catch (error) {
      logger.error('Message parse error:', error.message);
    }
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
