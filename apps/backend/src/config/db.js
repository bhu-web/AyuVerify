const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../ayuverify.db');
const db = new sqlite3.Database(dbPath);

const initDB = () => {
  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;');

    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('FARMER', 'PROCESSOR', 'QC_LAB', 'MANUFACTURER', 'REGULATOR')) NOT NULL,
        public_key TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Batches Table
    db.run(`
      CREATE TABLE IF NOT EXISTS batches (
        batch_id TEXT PRIMARY KEY,
        species TEXT NOT NULL,
        origin_district TEXT NOT NULL,
        collector_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collector_id) REFERENCES users(id)
      );
    `);

    // 3. Traceability Events Table
    db.run(`
      CREATE TABLE IF NOT EXISTS event_records (
        event_id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        stage TEXT CHECK(stage IN ('COLLECTION', 'PROCESSING', 'QC_TESTING', 'PACKAGING')) NOT NULL,
        payload_json TEXT NOT NULL,
        record_hash TEXT NOT NULL,
        digital_signature TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(batch_id),
        FOREIGN KEY (actor_id) REFERENCES users(id)
      );
    `, (err) => {
      if (err) {
        console.error('❌ Database Initialization Error:', err.message);
      } else {
        console.log('✅ SQLite Database Tables Initialized Successfully');
      }
    });
  });
};

module.exports = { db, initDB };