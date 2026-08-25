import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';
import { randomBytes } from 'node:crypto';
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.DATA_DIR || serverDir);
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');
export const config = {
  port: Number(process.env.PORT || 3000), jwtSecret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
  databasePath: path.resolve(process.env.DATABASE_PATH || path.join(dataDir, 'database.sqlite')),
  uploadsDir: path.resolve(process.env.UPLOADS_DIR || path.join(dataDir, 'uploads')),
  logDir: path.resolve(process.env.LOG_DIR || path.join(dataDir, 'logs')),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((value) => value.trim()).filter(Boolean),
  orphanGraceHours: Math.max(1, Number(process.env.ORPHAN_GRACE_HOURS || 24))
};
