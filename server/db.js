import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { config } from './config.js';

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await open({
    filename: config.databasePath,
    driver: sqlite3.Database
  });
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  await db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      name TEXT,
      password TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      content TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS post_images (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      image_url TEXT,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    );
    CREATE TABLE IF NOT EXISTS material_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      image_url TEXT,
      time TEXT,
      location TEXT,
      owner_nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS post_card_relations (
      post_id TEXT,
      card_id TEXT,
      PRIMARY KEY(post_id, card_id),
      FOREIGN KEY(post_id) REFERENCES posts(id),
      FOREIGN KEY(card_id) REFERENCES material_cards(id)
    );
    CREATE TABLE IF NOT EXISTS material_card_images (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(card_id) REFERENCES material_cards(id)
    );
    CREATE TABLE IF NOT EXISTS post_card_snapshots (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      source_card_id TEXT,
      snapshot_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    );
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      user1_id TEXT,
      user2_id TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user1_id) REFERENCES users(id),
      FOREIGN KEY(user2_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT,
      sender_id TEXT,
      type TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id),
      FOREIGN KEY(sender_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS pinned_chats (
      user_id TEXT,
      chat_id TEXT,
      PRIMARY KEY(user_id, chat_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(chat_id) REFERENCES chats(id)
    );
    CREATE TABLE IF NOT EXISTS chat_user_settings (
      user_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      remark TEXT DEFAULT '',
      is_blocked INTEGER DEFAULT 0,
      PRIMARY KEY(user_id, chat_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(chat_id) REFERENCES chats(id)
    );
    CREATE TABLE IF NOT EXISTS favorite_material_cards (
      user_id TEXT NOT NULL,
      source_card_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      remark TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, source_card_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  
  const addColumn = async (table, definition) => {
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    } catch {
      // Existing databases already have the column.
    }
  };

  await addColumn('users', 'password TEXT');
  await addColumn('material_cards', 'start_time TEXT');
  await addColumn('material_cards', 'end_time TEXT');
  await addColumn('material_cards', 'quantity INTEGER DEFAULT 1');
  await addColumn('material_cards', "event_tag TEXT DEFAULT '其他'");
  await addColumn('material_cards', "exchange_method TEXT DEFAULT '互换'");
  await addColumn('material_cards', "notes TEXT DEFAULT ''");
  await addColumn('material_cards', 'updated_at DATETIME');
  await addColumn('messages', 'read_at DATETIME');
  await addColumn('messages', "delivery_status TEXT DEFAULT 'sent'");
  await db.run("UPDATE messages SET delivery_status = 'sent' WHERE delivery_status IS NULL OR delivery_status = ''");

  await db.run(`
    UPDATE material_cards SET
      quantity = COALESCE(quantity, 1),
      event_tag = COALESCE(NULLIF(event_tag, ''), '其他'),
      exchange_method = COALESCE(NULLIF(exchange_method, ''), '互换'),
      notes = COALESCE(notes, ''),
      updated_at = COALESCE(updated_at, created_at)
  `);

  const legacyImages = await db.all(`
    SELECT id, image_url FROM material_cards
    WHERE image_url IS NOT NULL AND image_url != ''
      AND NOT EXISTS (SELECT 1 FROM material_card_images WHERE card_id = material_cards.id)
  `);
  for (const card of legacyImages) {
    await db.run(
      'INSERT INTO material_card_images (id, card_id, image_url, sort_order) VALUES (?, ?, ?, 0)',
      [`mci_legacy_${card.id}`, card.id, card.image_url]
    );
  }

  // Freeze existing post/card relations as snapshots before live cards can be edited.
  const legacyRelations = await db.all(`
    SELECT pcr.post_id, mc.* FROM post_card_relations pcr
    JOIN material_cards mc ON mc.id = pcr.card_id
    WHERE NOT EXISTS (
      SELECT 1 FROM post_card_snapshots pcs
      WHERE pcs.post_id = pcr.post_id AND pcs.source_card_id = pcr.card_id
    )
  `);
  for (const card of legacyRelations) {
    const images = await db.all(
      'SELECT image_url FROM material_card_images WHERE card_id = ? ORDER BY sort_order, id',
      [card.id]
    );
    const snapshot = {
      id: card.id,
      sourceCardId: card.id,
      name: card.name,
      images: images.map((image) => image.image_url),
      image: images[0]?.image_url || card.image_url,
      startTime: card.start_time,
      endTime: card.end_time,
      time: card.time,
      location: card.location,
      ownerCn: card.owner_nickname || '',
      owner: card.owner_nickname || '',
      quantity: card.quantity || 1,
      eventTag: card.event_tag || '其他',
      exchangeMethod: card.exchange_method || '互换',
      notes: card.notes || ''
    };
    await db.run(
      'INSERT INTO post_card_snapshots (id, post_id, source_card_id, snapshot_json) VALUES (?, ?, ?, ?)',
      [`pcs_legacy_${card.post_id}_${card.id}`, card.post_id, card.id, JSON.stringify(snapshot)]
    );
  }
  console.log('Database initialized successfully.');
}
