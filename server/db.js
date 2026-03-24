import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
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
  `);
  
  try {
    await db.exec('ALTER TABLE users ADD COLUMN password TEXT');
  } catch (e) {
    // Column likely already exists
  }
  console.log('Database initialized successfully.');
}
