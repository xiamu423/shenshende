import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { config } from './config.js';

const thumbnailDir = path.join(config.uploadsDir, 'thumbs');
await fs.mkdir(thumbnailDir, { recursive: true });
const supported = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
let created = 0; let skipped = 0; let failed = 0;
for (const entry of await fs.readdir(config.uploadsDir, { withFileTypes: true })) {
  if (!entry.isFile() || !supported.has(path.extname(entry.name).toLowerCase())) continue;
  const output = path.join(thumbnailDir, `${path.parse(entry.name).name}.webp`);
  try { await fs.access(output); skipped += 1; continue; } catch {}
  try {
    await sharp(path.join(config.uploadsDir, entry.name), { animated: false }).rotate()
      .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70, effort: 4 }).toFile(output);
    created += 1;
  } catch (error) { failed += 1; console.warn(`${entry.name}: ${error.message}`); }
}
console.log(JSON.stringify({ created, skipped, failed }));
