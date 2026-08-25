import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';
import { generateDefaultNickname } from './defaultNickname.js';
import { generateDefaultAvatar } from './defaultAvatar.js';
import { config } from './config.js';
import path from 'path';

const router = express.Router();
const SECRET = config.jwtSecret;
const uploadsDir = config.uploadsDir;

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits:{fileSize:10*1024*1024}, fileFilter(_req,file,callback){callback(null,['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype));} });

const EVENT_TAGS = [
  '其他', '深深的武汉', '深深的苏州', '深深的重庆', '深深的郑州', '深深的呼和浩特',
  '深深的沈阳', '深深的贵阳', '深深的济南', '深深的台州', '深深的北京', '深深的长沙',
  '深深的常州', '深深的厦门', '深深的佛山', '五月天鸟巢', '脱友3', '北京大眼',
  '王力宏成都', '大鱼海棠晚会', 'TMEA', '北京环球', '湖州音乐节', '澳门音乐节',
  '听见你音乐盛典', '南通音乐节'
];

function validateCardPayload(body) {
  const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
  const quantity = Number(body.quantity);
  if (!images.length) return '请至少上传一张物料图片';
  if (!body.name?.trim()) return '请填写物料名称';
  if (body.name.trim().length > 15) return '物料名称不能超过15字';
  if (!body.startTime || !body.endTime) return '请选择开始和结束时间';
  const start = new Date(body.startTime);
  const end = new Date(body.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '结束时间不能早于开始时间';
  if (!body.location?.trim()) return '请填写地点';
  if (body.location.trim().length > 30) return '地点不能超过30字';
  if ((body.ownerCn || '').trim().length > 15) return '物料主cn不能超过15字';
  if (!Number.isInteger(quantity) || quantity <= 0) return '物料份数必须是大于0的整数';
  if (!EVENT_TAGS.includes(body.eventTag)) return '请选择有效的活动标签';
  if (!['伸手', '互换'].includes(body.exchangeMethod)) return '请选择互换方式';
  if ((body.notes || '').length > 50) return '备注不能超过50字';
  return null;
}

async function normalizeCard(db, card) {
  const rows = await db.all(
    'SELECT image_url FROM material_card_images WHERE card_id = ? ORDER BY sort_order, id',
    [card.id]
  );
  const images = rows.map((row) => row.image_url);
  if (!images.length && card.image_url) images.push(card.image_url);
  return {
    ...card,
    images,
    image: images[0] || '',
    startTime: card.start_time || '',
    endTime: card.end_time || '',
    ownerCn: card.owner_nickname || '',
    owner: card.owner_nickname || '',
    quantity: card.quantity || 1,
    eventTag: card.event_tag || '其他',
    exchangeMethod: card.exchange_method || '互换',
    notes: card.notes || ''
  };
}

async function normalizePost(db, post) {
  const normalized = { ...post, author: { id: post.user_id, name: post.author_name, avatar: post.author_avatar } };
  const imgs = await db.all('SELECT image_url FROM post_images WHERE post_id = ?', [post.id]);
  normalized.images = imgs.map((image) => image.image_url);
  const snapshots = await db.all('SELECT snapshot_json FROM post_card_snapshots WHERE post_id = ? ORDER BY created_at, id', [post.id]);
  normalized.materialCards = snapshots.flatMap((row) => { try { return [JSON.parse(row.snapshot_json)]; } catch { return []; } });
  return normalized;
}

export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const verified = jwt.verify(token, SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/auth/register', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: '请输入账号和密码' });
  
  if (!/^[a-zA-Z0-9]{6,}$/.test(phone)) {
    return res.status(400).json({ error: '账号至少六位，且仅支持字母和数字' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少需要六位' });
  }

  const db = await getDb();
  
  let existing = await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
  if (existing) {
    if (!existing.password) {
      await db.run('UPDATE users SET password = ? WHERE id = ?', [password, existing.id]);
      const token = jwt.sign({ id: existing.id, phone }, SECRET, { expiresIn: '7d' });
      delete existing.password;
      return res.json({ user: existing, token });
    }
    return res.status(400).json({ error: '该账号已注册，请点下面去登录' });
  }
  
  const id = 'u_' + Date.now();
  const name = generateDefaultNickname();
  const avatar = generateDefaultAvatar();
  await db.run('INSERT INTO users (id, phone, name, avatar, password) VALUES (?, ?, ?, ?, ?)', [id, phone, name, avatar, password]);
  
  const token = jwt.sign({ id, phone }, SECRET, { expiresIn: '7d' });
  res.json({ user: { id, phone, name, avatar }, token });
});

router.get('/auth/check-account', async (req, res) => {
  const account = String(req.query.account || '');
  if (!/^[a-zA-Z0-9]{6,}$/.test(account)) return res.json({ available: false, valid: false });
  const db = await getDb();
  const existing = await db.get('SELECT id FROM users WHERE phone = ?', [account]);
  res.json({ available: !existing, valid: true });
});

router.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: '请输入账号和密码' });
  const db = await getDb();
  let user = await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '账号或密码错误' });
  }
  
  const token = jwt.sign({ id: user.id, phone: user.phone }, SECRET, { expiresIn: '7d' });
  delete user.password;
  res.json({ user, token });
});

router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// 3. Posts APIs
router.get('/posts', async (req, res) => {
  const db = await getDb();
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const clauses = []; const params = [];
  if (['未换完', '已换完'].includes(req.query.status)) { clauses.push('p.status = ?'); params.push(req.query.status); }
  if (['伸手', '互换'].includes(req.query.method)) {
    clauses.push("EXISTS (SELECT 1 FROM post_card_snapshots pcs WHERE pcs.post_id = p.id AND json_extract(pcs.snapshot_json, '$.exchangeMethod') = ?)");
    params.push(req.query.method);
  }
  const tags = String(req.query.tags || '').split(',').map((tag) => tag.trim()).filter((tag) => EVENT_TAGS.includes(tag));
  if (tags.length) {
    clauses.push(`EXISTS (SELECT 1 FROM post_card_snapshots pcs WHERE pcs.post_id = p.id AND json_extract(pcs.snapshot_json, '$.eventTag') IN (${tags.map(() => '?').join(',')}))`);
    params.push(...tags);
  }
  if (req.query.startTime && req.query.endTime) {
    clauses.push(`EXISTS (SELECT 1 FROM post_card_snapshots pcs WHERE pcs.post_id = p.id
      AND datetime(json_extract(pcs.snapshot_json, '$.startTime')) <= datetime(?)
      AND datetime(json_extract(pcs.snapshot_json, '$.endTime')) >= datetime(?))`);
    params.push(req.query.endTime, req.query.startTime);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const countRow = await db.get(`SELECT COUNT(*) AS total FROM posts p ${where}`, params);
  const rows = await db.all(`SELECT p.*, u.name AS author_name, u.avatar AS author_avatar FROM posts p JOIN users u ON p.user_id = u.id ${where} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  const items = await Promise.all(rows.map((post) => normalizePost(db, post)));
  res.json({ items, page, limit, total: countRow.total, hasMore: page * limit < countRow.total });
});

router.get('/posts/:id', async (req, res, next) => {
  if (['status'].includes(req.params.id)) return next();
  const db = await getDb();
  const post = await db.get('SELECT p.*, u.name AS author_name, u.avatar AS author_avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: '帖子不存在' });
  res.json(await normalizePost(db, post));
});

router.get('/users/me/posts', auth, async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT p.*, u.name AS author_name, u.avatar AS author_avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC', [req.user.id]);
  res.json(await Promise.all(rows.map((post) => normalizePost(db, post))));
});

router.get('/users/me/summary', auth, async (req, res) => {
  const db = await getDb();
  const posts = await db.get('SELECT COUNT(*) AS count FROM posts WHERE user_id = ?', [req.user.id]);
  res.json({ postCount: posts.count });
});

router.post('/posts', auth, async (req, res) => {
  const { title, content, status, images, materialCardIds } = req.body;
  const db = await getDb();
  const id = 'p_' + Date.now();
  
  await db.run('INSERT INTO posts (id, user_id, title, content, status) VALUES (?, ?, ?, ?, ?)', 
    [id, req.user.id, title, content, status || '未换完']);
    
  if (images && images.length) {
    for (const img of images) {
      await db.run('INSERT INTO post_images (id, post_id, image_url) VALUES (?, ?, ?)', ['pi_' + Date.now() + Math.random(), id, img]);
    }
  }
  
  if (materialCardIds && materialCardIds.length) {
    for (const cId of materialCardIds) {
      const card = await db.get('SELECT * FROM material_cards WHERE id = ? AND user_id = ?', [cId, req.user.id]);
      if (!card) continue;
      const normalized = await normalizeCard(db, card);
      const snapshot = { ...normalized, sourceCardId: card.id };
      await db.run('INSERT OR IGNORE INTO post_card_relations (post_id, card_id) VALUES (?, ?)', [id, cId]);
      await db.run(
        'INSERT INTO post_card_snapshots (id, post_id, source_card_id, snapshot_json) VALUES (?, ?, ?, ?)',
        [`pcs_${Date.now()}_${Math.random()}`, id, cId, JSON.stringify(snapshot)]
      );
    }
  }
  res.json({ success: true, id });
});

router.patch('/posts/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const post = await db.get('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Permission denied' });
  
  const newStatus = post.status === '已换完' ? '未换完' : '已换完';
  await db.run('UPDATE posts SET status = ? WHERE id = ?', [newStatus, id]);
  res.json({ success: true, status: newStatus });
});

router.delete('/posts/:id', auth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const post = await db.get('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Permission denied' });
  
  await db.run('DELETE FROM post_images WHERE post_id = ?', [id]);
  await db.run('DELETE FROM post_card_relations WHERE post_id = ?', [id]);
  await db.run('DELETE FROM post_card_snapshots WHERE post_id = ?', [id]);
  await db.run('DELETE FROM posts WHERE id = ?', [id]);
  
  res.json({ success: true });
});

// 4. Cards APIs
router.get('/cards', auth, async (req, res) => {
  const db = await getDb();
  const cards = await db.all('SELECT * FROM material_cards WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(await Promise.all(cards.map((card) => normalizeCard(db, card))));
});

router.post('/cards', auth, async (req, res) => {
  const error = validateCardPayload(req.body);
  if (error) return res.status(400).json({ error });
  const { name, images, startTime, endTime, location, ownerCn, quantity, eventTag, exchangeMethod, notes } = req.body;
  const db = await getDb();
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await db.run(`INSERT INTO material_cards
    (id, user_id, name, image_url, start_time, end_time, location, owner_nickname, quantity, event_tag, exchange_method, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, req.user.id, name.trim(), images[0], startTime, endTime, location.trim(), ownerCn?.trim() || '', Number(quantity), eventTag, exchangeMethod, notes?.trim() || '']);
  for (const [index, image] of images.entries()) {
    await db.run('INSERT INTO material_card_images (id, card_id, image_url, sort_order) VALUES (?, ?, ?, ?)',
      [`mci_${Date.now()}_${index}_${Math.random()}`, id, image, index]);
  }
  res.json({ success: true, id });
});

router.patch('/cards/:id', auth, async (req, res) => {
  const error = validateCardPayload(req.body);
  if (error) return res.status(400).json({ error });
  const db = await getDb();
  const card = await db.get('SELECT * FROM material_cards WHERE id = ?', [req.params.id]);
  if (!card) return res.status(404).json({ error: '物料卡不存在' });
  if (card.user_id !== req.user.id) return res.status(403).json({ error: 'Permission denied' });
  const { name, images, startTime, endTime, location, ownerCn, quantity, eventTag, exchangeMethod, notes } = req.body;
  await db.run(`UPDATE material_cards SET
    name = ?, image_url = ?, start_time = ?, end_time = ?, location = ?, owner_nickname = ?,
    quantity = ?, event_tag = ?, exchange_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [name.trim(), images[0], startTime, endTime, location.trim(), ownerCn?.trim() || '', Number(quantity), eventTag, exchangeMethod, notes?.trim() || '', req.params.id]);
  await db.run('DELETE FROM material_card_images WHERE card_id = ?', [req.params.id]);
  for (const [index, image] of images.entries()) {
    await db.run('INSERT INTO material_card_images (id, card_id, image_url, sort_order) VALUES (?, ?, ?, ?)',
      [`mci_${Date.now()}_${index}_${Math.random()}`, req.params.id, image, index]);
  }
  res.json({ success: true, id: req.params.id });
});

router.delete('/cards/:id', auth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const card = await db.get('SELECT * FROM material_cards WHERE id = ?', [id]);
  if (!card) return res.status(404).json({ error: 'Not found' });
  if (card.user_id !== req.user.id) return res.status(403).json({ error: 'Permission denied' });
  
  await db.run('DELETE FROM post_card_relations WHERE card_id = ?', [id]);
  await db.run('DELETE FROM material_card_images WHERE card_id = ?', [id]);
  await db.run('DELETE FROM material_cards WHERE id = ?', [id]);
  res.json({ success: true });
});

// Favorite material cards are saved as snapshots so later edits or deletion of
// the original card do not break a user's collection.
router.get('/favorite-cards', auth, async (req, res) => {
  const db = await getDb();
  const rows = await db.all(
    'SELECT source_card_id, snapshot_json, remark, created_at FROM favorite_material_cards WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows.flatMap((row) => {
    try { return [{ ...JSON.parse(row.snapshot_json), sourceCardId: row.source_card_id, favoriteRemark: row.remark || '', favoritedAt: row.created_at, isFavorite: true }]; }
    catch { return []; }
  }));
});

router.post('/favorite-cards', auth, async (req, res) => {
  const sourceCardId = String(req.body.sourceCardId || req.body.card?.sourceCardId || req.body.card?.id || '').trim();
  const card = req.body.card;
  if (!sourceCardId || !card?.name) return res.status(400).json({ error: '物料卡信息无效' });
  const snapshot = {
    id: card.id || sourceCardId, sourceCardId, name: String(card.name).slice(0, 15),
    images: Array.isArray(card.images) ? card.images.filter(Boolean).slice(0, 20) : [], image: card.image || '',
    startTime: card.startTime || '', endTime: card.endTime || '', time: card.time || '',
    location: String(card.location || '').slice(0, 30), ownerCn: String(card.ownerCn || card.owner || '').slice(0, 15),
    quantity: Number(card.quantity) || 1, eventTag: card.eventTag || '其他',
    exchangeMethod: card.exchangeMethod || '互换', notes: String(card.notes || '').slice(0, 50)
  };
  const db = await getDb();
  await db.run(`INSERT INTO favorite_material_cards (user_id, source_card_id, snapshot_json)
    VALUES (?, ?, ?) ON CONFLICT(user_id, source_card_id) DO UPDATE SET snapshot_json = excluded.snapshot_json`,
    [req.user.id, sourceCardId, JSON.stringify(snapshot)]);
  res.json({ success: true });
});

router.patch('/favorite-cards/:id/remark', auth, async (req, res) => {
  const remark = String(req.body.remark || '').trim();
  if (remark.length > 30) return res.status(400).json({ error: '备注不能超过30字' });
  const db = await getDb();
  const result = await db.run('UPDATE favorite_material_cards SET remark = ? WHERE user_id = ? AND source_card_id = ?', [remark, req.user.id, req.params.id]);
  if (!result.changes) return res.status(404).json({ error: '收藏不存在' });
  res.json({ success: true, remark });
});

router.delete('/favorite-cards/:id', auth, async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM favorite_material_cards WHERE user_id = ? AND source_card_id = ?', [req.user.id, req.params.id]);
  res.json({ success: true });
});

// 5. Chat APIs
router.get('/chats', auth, async (req, res) => {
  const db = await getDb();
  const chats = await db.all(`
    SELECT c.*, 
    u1.id as u1_id, u1.name as u1_name, u1.avatar as u1_avatar,
    u2.id as u2_id, u2.name as u2_name, u2.avatar as u2_avatar,
    CASE WHEN pc.chat_id IS NOT NULL THEN 1 ELSE 0 END as isPinned,
    COALESCE(cus.remark, '') as userRemark,
    COALESCE(cus.is_blocked, 0) as isBlocked,
    (SELECT COUNT(*) FROM messages unread
      WHERE unread.chat_id = c.id AND unread.sender_id != ? AND unread.read_at IS NULL AND unread.delivery_status != 'failed'
    ) as unreadCount
    FROM chats c
    JOIN users u1 ON c.user1_id = u1.id
    JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN pinned_chats pc ON c.id = pc.chat_id AND pc.user_id = ?
    LEFT JOIN chat_user_settings cus ON c.id = cus.chat_id AND cus.user_id = ?
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY isPinned DESC, c.updated_at DESC
  `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);
  
  const result = [];
  for (let c of chats) {
    const isU1 = c.u1_id === req.user.id;
    const actualName = isU1 ? c.u2_name : c.u1_name;
    const otherUser = {
      id: isU1 ? c.u2_id : c.u1_id,
      name: c.userRemark || actualName,
      actualName,
      avatar: isU1 ? c.u2_avatar : c.u1_avatar
    };
    
    const lastMsg = await db.get("SELECT *, sender_id as senderId FROM messages WHERE chat_id = ? AND (delivery_status != 'failed' OR sender_id = ?) ORDER BY created_at DESC LIMIT 1", [c.id, req.user.id]);
    
    result.push({
      id: c.id,
      user: otherUser,
      isPinned: !!c.isPinned,
      unreadCount: c.unreadCount || 0,
      isBlocked: !!c.isBlocked,
      lastMessage: lastMsg || null,
      messages: [] // handled per chat detail request
    });
  }
  
  res.json(result);
});

router.post('/chats', auth, async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({error: 'targetUserId required'});
  const db = await getDb();
  
  let chat = await db.get(`
    SELECT * FROM chats 
    WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
  `, [req.user.id, targetUserId, targetUserId, req.user.id]);
  
  if (!chat) {
    chat = { id: 'chat_' + Date.now() };
    await db.run('INSERT INTO chats (id, user1_id, user2_id) VALUES (?, ?, ?)', [chat.id, req.user.id, targetUserId]);
  }
  
  res.json({ id: chat.id });
});

router.get('/chats/:id/messages', auth, async (req, res) => {
  const db = await getDb();
  const messages = await db.all("SELECT *, sender_id as senderId, delivery_status as deliveryStatus FROM messages WHERE chat_id = ? AND (delivery_status != 'failed' OR sender_id = ?) ORDER BY created_at ASC", [req.params.id, req.user.id]);
  res.json(messages);
});

router.patch('/chats/:id/remark', auth, async (req, res) => {
  const db = await getDb();
  const remark = String(req.body.remark || '').trim().slice(0, 15);
  await db.run(`INSERT INTO chat_user_settings (user_id, chat_id, remark, is_blocked) VALUES (?, ?, ?, 0)
    ON CONFLICT(user_id, chat_id) DO UPDATE SET remark = excluded.remark`, [req.user.id, req.params.id, remark]);
  res.json({ success: true, remark });
});

router.patch('/chats/:id/block', auth, async (req, res) => {
  const db = await getDb();
  const current = await db.get('SELECT is_blocked FROM chat_user_settings WHERE user_id = ? AND chat_id = ?', [req.user.id, req.params.id]);
  const isBlocked = current?.is_blocked ? 0 : 1;
  await db.run(`INSERT INTO chat_user_settings (user_id, chat_id, remark, is_blocked) VALUES (?, ?, '', ?)
    ON CONFLICT(user_id, chat_id) DO UPDATE SET is_blocked = excluded.is_blocked`, [req.user.id, req.params.id, isBlocked]);
  res.json({ success: true, isBlocked: !!isBlocked });
});

router.patch('/chats/:id/read', auth, async (req, res) => {
  const db = await getDb();
  const chat = await db.get('SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)', [req.params.id, req.user.id, req.user.id]);
  if (!chat) return res.status(404).json({ error: '会话不存在' });
  await db.run(
    'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE chat_id = ? AND sender_id != ? AND read_at IS NULL',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

router.post('/chats/:id/messages', auth, async (req, res) => {
  const { type, content } = req.body;
  const db = await getDb();
  const id = 'm_' + Date.now();
  const chat = await db.get('SELECT * FROM chats WHERE id = ?', [req.params.id]);
  if (!chat || (chat.user1_id !== req.user.id && chat.user2_id !== req.user.id)) return res.status(404).json({ error: '会话不存在' });
  const recipientId = chat.user1_id === req.user.id ? chat.user2_id : chat.user1_id;
  const blocked = await db.get('SELECT is_blocked FROM chat_user_settings WHERE user_id = ? AND chat_id = ?', [recipientId, req.params.id]);
  const deliveryStatus = blocked?.is_blocked ? 'failed' : 'sent';
  await db.run('INSERT INTO messages (id, chat_id, sender_id, type, content, delivery_status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.params.id, req.user.id, type, content, deliveryStatus]);
  if (deliveryStatus === 'sent') {
    await db.run('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
  }
  res.json({ success: deliveryStatus === 'sent', blocked: deliveryStatus === 'failed', id, deliveryStatus });
});

router.patch('/chats/:id/pin', auth, async (req, res) => {
  const db = await getDb();
  const pinned = await db.get('SELECT * FROM pinned_chats WHERE user_id = ? AND chat_id = ?', [req.user.id, req.params.id]);
  if (pinned) {
    await db.run('DELETE FROM pinned_chats WHERE user_id = ? AND chat_id = ?', [req.user.id, req.params.id]);
    res.json({ isPinned: false });
  } else {
    await db.run('INSERT INTO pinned_chats (user_id, chat_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    res.json({ isPinned: true });
  }
});

// 6. User APIs
router.patch('/users/profile', auth, async (req, res) => {
  if ('phone' in req.body || 'account' in req.body) return res.status(400).json({ error: '账号不可修改' });
  const { name, avatar } = req.body;
  if (!name && !avatar) return res.status(400).json({ error: 'No data to update' });
  if (name && (!name.trim() || name.trim().length > 15)) return res.status(400).json({ error: '昵称不能为空且不能超过15字' });
  
  const db = await getDb();
  let query = 'UPDATE users SET ';
  const params = [];
  
  if (name) {
    query += 'name = ?, ';
    params.push(name.trim());
  }
  if (avatar) {
    query += 'avatar = ?, ';
    params.push(avatar);
  }
  
  query = query.slice(0, -2);
  query += ' WHERE id = ?';
  params.push(req.user.id);
  
  await db.run(query, params);
  
  // also return updated user
  const updatedUser = await db.get('SELECT id, phone, name, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json(updatedUser);
});

export default router;
