import fs from 'fs';
import path from 'path';
import { config } from './config.js';
fs.mkdirSync(config.logDir, { recursive: true });
export function logError(error, context = {}) {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), message: error?.message || String(error), stack: error?.stack, ...context });
  console.error(entry); fs.appendFile(path.join(config.logDir, 'error.log'), `${entry}\n`, () => {});
}
