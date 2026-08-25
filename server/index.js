import express from 'express';
import cors from 'cors';
import fs from 'fs';
import process from 'node:process';
import { initDb, getDb } from './db.js';
import apiRoutes from './routes.js';
import { config } from './config.js';
import { logError } from './logger.js';

fs.mkdirSync(config.uploadsDir, { recursive: true });
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin(origin, callback) { if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error(`CORS blocked origin: ${origin}`)); }, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '7d', immutable: true }));
app.use('/api', apiRoutes);
app.get('/api/health', async (_req, res) => { try { const db = await getDb(); await db.get('SELECT 1'); res.json({ status:'ok', uptime:Math.floor(process.uptime()), database:'ok', timestamp:new Date().toISOString() }); } catch (error) { logError(error,{area:'health'}); res.status(503).json({status:'error',database:'unavailable'}); } });
app.use((error, req, res, next) => { void next; logError(error,{method:req.method,path:req.originalUrl}); res.status(error.message?.startsWith('CORS')?403:500).json({error:'服务器内部错误'}); });

await initDb();
const server = app.listen(config.port,'127.0.0.1',()=>console.log(`Server running on http://127.0.0.1:${config.port}`));
process.on('unhandledRejection',(error)=>logError(error,{area:'unhandledRejection'}));
process.on('uncaughtException',(error)=>{logError(error,{area:'uncaughtException'});server.close(()=>process.exit(1));setTimeout(()=>process.exit(1),5000).unref()});
