const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../ayuverify.db');
const db = new sqlite3.Database(dbPath);

const seedDefaultUsers = () => {
  // Use hashSync inside serialize so it executes sequentially without race conditions
  const defaultHash = bcrypt.hashSync('password123', 10);

  const defaultUsers = [
    {
      id: 'FARMER_01',
      name: 'Ramesh Patel (Collector)',
      email: 'farmer@ayuverify.org',
      role: 'FARMER',
      publicKey: 'wT1yP8f/0j3n9X4Qk4m3yJ7hN8kL9vP2qR4sT5uV6w8='
    },
    {
      id: 'PROCESSOR_01',
      name: 'AyurProcess Extraction Ltd',
      email: 'processor@ayuverify.org',
      role: 'PROCESSOR',
      publicKey: 'xK9yP8f/0j3n9X4Qk4m3yJ7hN8kL9vP2qR4sT5uV6w8='
    },
    {
      id: 'QC_LAB_01',
      name: 'BioAyu Analytical Laboratories',
      email: 'qc@ayuverify.org',
      role: 'QC_LAB',
      publicKey: 'zM2yP8f/0j3n9X4Qk4m3yJ7hN8kL9vP2qR4sT5uV6w8='
    },
    {
      id: 'MANUFACTURER_01',
      name: 'PureVeda Naturals',
      email: 'manufacturer@ayuverify.org',
      role: 'MANUFACTURER',
      publicKey: 'qR3yP8f/0j3n9X4Qk4m3yJ7hN8kL9vP2qR4sT5uV6w8='
    }
  ];

  defaultUsers.forEach((u) => {
    db.run(
      `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, public_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, defaultHash, u.role, u.publicKey],
      (err) => {
        if (err) {
          console.error(`❌ Seeding error for ${u.id}:`, err.message);
        }
      }
    );
  });

  console.log('✅ Default Stakeholders Seeded Successfully');
};

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
        // Seed users immediately once tables are created
        seedDefaultUsers();
      }
    });
  });
};

module.exports = { db, initDB };