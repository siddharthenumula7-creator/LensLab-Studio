const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const DATABASE_PATH = path.join(__dirname, "lenslab.db");

async function initializeDatabase() {
  const db = await open({
    filename: DATABASE_PATH,
    driver: sqlite3.Database
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS photographers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photographer_id INTEGER NOT NULL,
      camera_id INTEGER NOT NULL,
      rental_date TEXT NOT NULL,
      return_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (photographer_id) REFERENCES photographers(id),
      FOREIGN KEY (camera_id) REFERENCES cameras(id)
    );
  `);

  return db;
}

module.exports = { initializeDatabase, DATABASE_PATH };
