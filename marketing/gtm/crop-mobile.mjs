import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '/Users/lijiayue/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';

const root = path.dirname(new URL(import.meta.url).pathname);
const source = path.join(root, 'source');
const output = path.join(root, 'mobile-review');
const files = {
  'native-community.jpg': '01-community.png',
  'native-filter.jpg': '02-filter.png',
  'native-post.jpg': '03-post-detail.png',
  'native-material.jpg': '04-material-card.png',
  'native-chat-list.jpg': '05-chat-list.png',
  'native-chat.jpg': '06-chat-detail.png',
  'native-profile.jpg': '07-profile.png',
  'native-favorites.jpg': '08-favorites.png'
};

await fs.mkdir(output, { recursive: true });
for (const [input, name] of Object.entries(files)) {
  const image = sharp(path.join(source, input));
  await image
    .extract({ left: 6, top: 0, width: 196, height: 426 })
    .resize(1179, 2556, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(output, name));
}
console.log(`Prepared ${Object.keys(files).length} mobile screenshots in ${output}`);
