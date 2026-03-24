import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';
import path from 'path';

const router = express.Router();
const SECRET = 'shenshende_secret_2026';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const verified = jwt.verify(token, SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/auth/register', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: '请输入账号和密码' });
  
  if (!/^[a-zA-Z0-9_]{3,}$/.test(phone)) {
    return res.status(400).json({ error: '账号最少三个字符，且只能包含字母、数字或下划线' });
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
  const name = phone;
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
  await db.run('INSERT INTO users (id, phone, name, avatar, password) VALUES (?, ?, ?, ?, ?)', [id, phone, name, avatar, password]);
  
  const token = jwt.sign({ id, phone }, SECRET, { expiresIn: '7d' });
  res.json({ user: { id, phone, name, avatar }, token });
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
  const posts = await db.all(`
    SELECT p.*, u.name as author_name, u.avatar as author_avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `);
  
  for (let p of posts) {
    p.author = { id: p.user_id, name: p.author_name, avatar: p.author_avatar };
    const imgs = await db.all('SELECT image_url FROM post_images WHERE post_id = ?', [p.id]);
    p.images = imgs.map(i => i.image_url);
    p.materialCards = await db.all(`
      SELECT mc.* FROM material_cards mc
      JOIN post_card_relations pcr ON mc.id = pcr.card_id
      WHERE pcr.post_id = ?
    `, [p.id]);
  }
  res.json(posts);
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
      await db.run('INSERT INTO post_card_relations (post_id, card_id) VALUES (?, ?)', [id, cId]);
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
  await db.run('DELETE FROM posts WHERE id = ?', [id]);
  
  res.json({ success: true });
});

// 4. Cards APIs
router.get('/cards', auth, async (req, res) => {
  const db = await getDb();
  const cards = await db.all('SELECT * FROM material_cards WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  cards.forEach(c => c.owner = c.owner_nickname); // Map to match frontend expectations
  res.json(cards);
});

router.post('/cards', auth, async (req, res) => {
  const { name, image_url, time, location, owner_nickname } = req.body;
  const db = await getDb();
  const id = 'c_' + Date.now();
  await db.run('INSERT INTO material_cards (id, user_id, name, image_url, time, location, owner_nickname) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, req.user.id, name, image_url, time, location, owner_nickname]);
  res.json({ success: true, id });
});

router.delete('/cards/:id', auth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const card = await db.get('SELECT * FROM material_cards WHERE id = ?', [id]);
  if (!card) return res.status(404).json({ error: 'Not found' });
  if (card.user_id !== req.user.id) return res.status(403).json({ error: 'Permission denied' });
  
  await db.run('DELETE FROM post_card_relations WHERE card_id = ?', [id]);
  await db.run('DELETE FROM material_cards WHERE id = ?', [id]);
  res.json({ success: true });
});

// 5. Chat APIs
router.get('/chats', auth, async (req, res) => {
  const db = await getDb();
  const chats = await db.all(`
    SELECT c.*, 
    u1.id as u1_id, u1.name as u1_name, u1.avatar as u1_avatar,
    u2.id as u2_id, u2.name as u2_name, u2.avatar as u2_avatar,
    CASE WHEN pc.chat_id IS NOT NULL THEN 1 ELSE 0 END as isPinned
    FROM chats c
    JOIN users u1 ON c.user1_id = u1.id
    JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN pinned_chats pc ON c.id = pc.chat_id AND pc.user_id = ?
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY isPinned DESC, c.updated_at DESC
  `, [req.user.id, req.user.id, req.user.id]);
  
  const result = [];
  for (let c of chats) {
    const isU1 = c.u1_id === req.user.id;
    const otherUser = {
      id: isU1 ? c.u2_id : c.u1_id,
      name: isU1 ? c.u2_name : c.u1_name,
      avatar: isU1 ? c.u2_avatar : c.u1_avatar
    };
    
    const lastMsg = await db.get('SELECT *, sender_id as senderId FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1', [c.id]);
    
    result.push({
      id: c.id,
      user: otherUser,
      isPinned: !!c.isPinned,
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
  const messages = await db.all('SELECT *, sender_id as senderId FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [req.params.id]);
  res.json(messages);
});

router.post('/chats/:id/messages', auth, async (req, res) => {
  const { type, content } = req.body;
  const db = await getDb();
  const id = 'm_' + Date.now();
  await db.run('INSERT INTO messages (id, chat_id, sender_id, type, content) VALUES (?, ?, ?, ?, ?)',
    [id, req.params.id, req.user.id, type, content]);
  await db.run('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
  res.json({ success: true, id });
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
  const { name, avatar } = req.body;
  if (!name && !avatar) return res.status(400).json({ error: 'No data to update' });
  
  const db = await getDb();
  let query = 'UPDATE users SET ';
  const params = [];
  
  if (name) {
    query += 'name = ?, ';
    params.push(name);
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
  const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json(updatedUser);
});

export default router;
