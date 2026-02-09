const { Bonjour } = require('bonjour-service');
const os = require('os');
const config = require('../utils/config');
const logger = require('../utils/logger');

class DiscoveryService {
  constructor() {
    this.bonjour = new Bonjour();
    this.service = null;
  }

  start() {
    const deviceName = os.hostname();

    this.service = this.bonjour.publish({
      name: `iPad-Canvas-${deviceName}`,
      type: config.SERVICE_TYPE,
      port: config.WEBSOCKET_PORT,
      txt: {
        version: config.VERSION,
        deviceName: deviceName,
      },
    });

    this.service.on('up', () => {
      logger.info(`Broadcasting mDNS: _${config.SERVICE_TYPE}._tcp on port ${config.WEBSOCKET_PORT}`);
    });

    this.service.on('error', (err) => {
      logger.error('mDNS broadcast error:', err.message);
    });

    return this.service;
  }

  stop() {
    if (this.service) {
      this.service.stop(() => {
        logger.info('mDNS broadcast stopped');
      });
      this.service = null;
    }
    this.bonjour.destroy();
  }
}

module.exports = DiscoveryService;
