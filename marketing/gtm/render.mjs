import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '/Users/lijiayue/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const SOURCE = path.join(ROOT, 'source');
const FINAL = path.join(ROOT, 'final');
const W = 1179;
const H = 2556;

const dataUri = async (name) => {
  const file = await fs.readFile(path.join(SOURCE, name));
  const mime = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${file.toString('base64')}`;
};

const background = await dataUri('brand-background.png');

function header(index, eyebrow, title, subtitle) {
  const lines = title.split('\n');
  return `
    <rect x="76" y="78" width="116" height="42" rx="21" fill="#294A8D"/>
    <text x="134" y="106" text-anchor="middle" class="index">${index}</text>
    <text x="222" y="108" class="eyebrow">${eyebrow}</text>
    ${lines.map((line, i) => `<text x="76" y="${220 + i * 104}" class="title">${line}</text>`).join('')}
    <text x="76" y="${250 + lines.length * 104}" class="subtitle">${subtitle}</text>`;
}

function screenshot(href, y, height = 690, rotate = 0) {
  const width = 1027;
  return `
    <g transform="rotate(${rotate} ${W / 2} ${y + height / 2})" filter="url(#shadow)">
      <rect x="76" y="${y}" width="${width}" height="${height}" rx="40" fill="#fff"/>
      <image href="${href}" x="76" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#shotClip${y})"/>
      <rect x="76" y="${y}" width="${width}" height="${height}" rx="40" fill="none" stroke="#E2D9CB" stroke-width="3"/>
    </g>
    <clipPath id="shotClip${y}"><rect x="76" y="${y}" width="${width}" height="${height}" rx="40"/></clipPath>`;
}

function pills(items, y) {
  let x = 76;
  return items.map((item) => {
    const width = Math.max(164, item.length * 34 + 62);
    const result = `<rect x="${x}" y="${y}" width="${width}" height="70" rx="35" fill="#FFF9EA" stroke="#D8C59D" stroke-width="2"/><text x="${x + width / 2}" y="${y + 45}" text-anchor="middle" class="pill">${item}</text>`;
    x += width + 18;
    return result;
  }).join('');
}

function footer(label) {
  return `<text x="76" y="2472" class="brand">COMINO WORLD</text><text x="1103" y="2472" text-anchor="end" class="page">${label}</text>`;
}

function base(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#16264D" flood-opacity=".20"/></filter>
    <style>
      text{font-family:'PingFang SC','Hiragino Sans GB','Noto Sans CJK SC',sans-serif;fill:#17213A}
      .index{fill:#fff;font-size:25px;font-weight:800;letter-spacing:2px}.eyebrow{fill:#294A8D;font-size:26px;font-weight:800;letter-spacing:5px}
      .title{font-size:72px;font-weight:850;letter-spacing:-2px}.subtitle{fill:#6E6B65;font-size:31px;font-weight:550}.pill{fill:#765B3B;font-size:25px;font-weight:750}
      .brand{fill:#294A8D;font-size:25px;font-weight:850;letter-spacing:4px}.page{fill:#765B3B;font-size:23px;font-weight:700;letter-spacing:3px}
      .big{font-size:95px;font-weight:900;fill:#294A8D}.copy{font-size:36px;font-weight:650;fill:#514B43}.small{font-size:25px;fill:#706B63}
    </style>
  </defs>
  <image href="${background}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${W}" height="${H}" fill="#FFFDF8" opacity=".16"/>
  ${content}
  </svg>`;
}

const community = await dataUri('community.jpg');
const filter = await dataUri('filter.jpg');
const material = await dataUri('material-modal.jpg');
const post = await dataUri('post-detail.jpg');
const chatList = await dataUri('chat-list.jpg');
const chatDetail = await dataUri('chat-detail.jpg');
const profile = await dataUri('profile.jpg');
const favorites = await dataUri('favorites.jpg');

const pages = [
  {
    name: '01-cover.png',
    svg: base(`
      <rect x="76" y="104" width="1027" height="188" rx="56" fill="#294A8D" filter="url(#shadow)"/>
      <rect x="116" y="144" width="108" height="108" rx="34" fill="#F2C96D"/><text x="170" y="218" text-anchor="middle" class="big" style="font-size:62px;fill:#294A8D">米</text>
      <text x="260" y="190" style="fill:#fff;font-size:42px;font-weight:900;letter-spacing:5px">COMINO WORLD</text>
      <text x="260" y="235" style="fill:#DCE5FA;font-size:23px;letter-spacing:4px">EXCHANGE · TREASURE · MEET</text>
      <text x="76" y="610" class="big">万事米丽，</text><text x="76" y="730" class="big">坏事嫑来</text>
      <text x="82" y="840" class="copy">让喜欢的物料，遇见喜欢它的人。</text>
      <g filter="url(#shadow)"><rect x="76" y="1030" width="1027" height="710" rx="54" fill="#FFFDF8" stroke="#E2D9CB" stroke-width="3"/>
      <text x="132" y="1160" class="eyebrow">演出物料交换社区</text>
      <text x="132" y="1325" class="title" style="font-size:62px">发布 · 交换 · 收藏 · 私信</text>
      <line x1="132" y1="1418" x2="1047" y2="1418" stroke="#D8C59D" stroke-width="2" stroke-dasharray="10 12"/>
      <text x="132" y="1530" class="copy">把现场的认真准备，交给同样珍惜它的人。</text>
      <text x="132" y="1600" class="small">一套更清晰、更自在的物料交换方式</text></g>
      ${pills(['社区广场','物料卡','私信交换'],1890)}
      ${footer('BRAND STORY / 01')}`)
  },
  {
    name: '02-community.png',
    svg: base(`${header('02','DISCOVER','找到同好，\n也找到心意','最新发布分批加载，四类条件可以联合筛选。')}${screenshot(community,610,720,-1.2)}${screenshot(filter,1405,580,1.1)}${pills(['交换状态','交换时间','活动标签','互换方式'],2100)}${footer('DISCOVER / 02')}`)
  },
  {
    name: '03-material-card.png',
    svg: base(`${header('03','MATERIAL CARD','一张卡，装下\n所有交换信息','图片、时间、地点、标签、份数，一眼看清。')}${screenshot(material,660,980,-1)}${pills(['多图预览','信息快照','随时编辑'],1785)}<text x="76" y="2035" class="copy">发布时自动保存快照，</text><text x="76" y="2090" class="copy">历史内容不会被后来修改影响。</text>${footer('MATERIAL / 03')}`)
  },
  {
    name: '04-post.png',
    svg: base(`${header('04','SHARE','从物料卡，\n到一条清楚的帖子','一条帖子可关联 0—3 张物料卡，组合更自由。')}${screenshot(post,650,880,.8)}<g filter="url(#shadow)"><rect x="76" y="1640" width="1027" height="385" rx="42" fill="#294A8D"/><text x="132" y="1760" style="fill:#F2C96D;font-size:27px;font-weight:800;letter-spacing:4px">交换状态</text><text x="132" y="1860" style="fill:#fff;font-size:58px;font-weight:850">交换中 ↔ 换完了</text><text x="132" y="1940" style="fill:#DCE5FA;font-size:28px">状态清晰，物料信息完整，沟通更轻松。</text></g>${footer('PUBLISH / 04')}`)
  },
  {
    name: '05-chat.png',
    svg: base(`${header('05','CONNECT','从看见，\n到聊上','备注、置顶、物料卡发送，让交换自然发生。')}${screenshot(chatList,650,610,-1.2)}${screenshot(chatDetail,1330,710,1.1)}${pills(['未读提醒','会话置顶','发送物料卡'],2150)}${footer('CONNECT / 05')}`)
  },
  {
    name: '06-collection.png',
    svg: base(`${header('06','YOUR WORLD','喜欢的物料，\n留在自己的世界','收藏自己或他人的物料卡，也能写下私人备注。')}${screenshot(favorites,650,650,-1.1)}${screenshot(profile,1370,650,1)}${pills(['收藏备注','个人物料库','发布管理'],2140)}${footer('COLLECTION / 06')}`)
  }
];

await fs.mkdir(FINAL, { recursive: true });
for (const page of pages) {
  await sharp(Buffer.from(page.svg)).png({ compressionLevel: 9 }).toFile(path.join(FINAL, page.name));
}
console.log(`Rendered ${pages.length} files to ${FINAL}`);
