
// ============================================================
// utils/logger.js — Simple console logger with levels
// ============================================================
 
const LEVELS = { info: '📘', warn: '⚠️', error: '❌' };
 
function format(level, msg, ...args) {
  const ts = new Date().toISOString();
  console[level](`[${ts}] ${LEVELS[level]} ${msg}`, ...args);
}
 
export const logger = {
  info:  (msg, ...args) => format('info', msg, ...args),
  warn:  (msg, ...args) => format('warn', msg, ...args),
  error: (msg, ...args) => format('error', msg, ...args),
};
 
