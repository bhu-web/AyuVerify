import * as SQLite from 'expo-sqlite';

// Open local SQLite database on mobile device
const db = SQLite.openDatabaseSync('ayuverify_local.db');

export const initLocalDB = () => {
  // Local Event Queue Table for offline storage
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_events (
      event_id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      record_hash TEXT NOT NULL,
      digital_signature TEXT NOT NULL,
      sync_status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('📱 Local Mobile Database Initialized');
};

/**
 * Queue a signed event record locally when offline
 */
export const queueEventLocally = (event) => {
  const { eventId, batchId, actorId, stage, payload, recordHash, digitalSignature } = event;
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const statement = db.prepareSync(`
    INSERT INTO pending_events (event_id, batch_id, actor_id, stage, payload_json, record_hash, digital_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  statement.executeSync([eventId, batchId, actorId, stage, payloadString, recordHash, digitalSignature]);
  console.log(`📦 Event ${eventId} saved to local queue`);
};

/**
 * Fetch all pending events that need sync
 */
export const getPendingEvents = () => {
  return db.getAllSync(`SELECT * FROM pending_events WHERE sync_status = 'PENDING' ORDER BY created_at ASC`);
};

/**
 * Mark event as synchronized after backend confirms ingestion
 */
export const markEventSynced = (eventId) => {
  db.runSync(`UPDATE pending_events SET sync_status = 'SYNCED' WHERE event_id = ?`, [eventId]);
};