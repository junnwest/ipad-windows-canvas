const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.argv.includes('--dev') ? 'debug' : 'info';

function log(level, ...args) {
  if (levels[level] <= levels[currentLevel]) {
    const timestamp = new Date().toISOString();
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `[${timestamp}] [${level.toUpperCase()}]`,
      ...args
    );
  }
}

module.exports = {
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  info: (...args) => log('info', ...args),
  debug: (...args) => log('debug', ...args),
};
