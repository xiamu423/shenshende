import fs from 'fs/promises';
import path from 'path';
import process from 'node:process';
import { getDb } from './db.js';
import { config } from './config.js';

const apply = process.argv.includes('--apply');
const referenced = new Set();
const collect = (value) => {
  if (typeof value === 'string') {
    const matches = value.matchAll(/\/uploads\/([^"'?#\\/]+)/g);
    for (const match of matches) referenced.add(decodeURIComponent(match[1]));
    try { collect(JSON.parse(value)); } catch { /* ordinary string */ }
  } else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
};

const db = await getDb();
for (const query of [
  'SELECT avatar AS value FROM users', 'SELECT image_url AS value FROM post_images',
  'SELECT image_url AS value FROM material_cards', 'SELECT image_url AS value FROM material_card_images',
  'SELECT snapshot_json AS value FROM post_card_snapshots', 'SELECT snapshot_json AS value FROM favorite_material_cards',
  "SELECT content AS value FROM messages WHERE type = 'image'"
]) (await db.all(query)).forEach((row) => collect(row.value));

await fs.mkdir(config.uploadsDir,{recursive:true});
const cutoff = Date.now() - config.orphanGraceHours * 3600_000;
const removed=[]; const retained=[];
for (const entry of await fs.readdir(config.uploadsDir,{withFileTypes:true})) {
  if (!entry.isFile()) continue;
  const filePath=path.join(config.uploadsDir,entry.name); const stat=await fs.stat(filePath);
  if (!referenced.has(entry.name) && stat.mtimeMs < cutoff) { if(apply) await fs.unlink(filePath); removed.push(entry.name); }
  else retained.push(entry.name);
}
console.log(JSON.stringify({mode:apply?'apply':'dry-run',graceHours:config.orphanGraceHours,referenced:referenced.size,removed:removed.length,retained:retained.length,files:removed},null,2));
await db.close();
