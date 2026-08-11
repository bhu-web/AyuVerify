import * as SQLite from 'expo-sqlite';
import axios from 'axios';

// Open or create local SQLite database for offline event queueing
const db = SQLite.openDatabaseSync('ayuverify_offline.db');

// Initialize device-level SQLite table
db.execSync(`
  CREATE TABLE IF NOT EXISTS pending_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

/**
 * Queue an event locally when device is offline
 */
export async function captureOfflineEvent({ actorId, stage, payload }) {
  const createdAt = new Date().toISOString();
  const payloadStr = JSON.stringify(payload);

  db.runSync(
    'INSERT INTO pending_events (actor_id, stage, payload, created_at) VALUES (?, ?, ?, ?);',
    [actorId, stage, payloadStr, createdAt]
  );
}

/**
 * Retrieve total count of unsynced events stored locally
 */
export async function getPendingCount() {
  const result = db.getFirstSync('SELECT COUNT(*) as count FROM pending_events;');
  return result ? result.count : 0;
}

/**
 * Upload all pending queued events sequentially to central backend API
 */
export async function syncPendingEvents(backendUrl) {
  const rows = db.getAllSync('SELECT * FROM pending_events ORDER BY id ASC;');

  if (rows.length === 0) return 0;

  let syncedCount = 0;

  for (const row of rows) {
    const payload = JSON.parse(row.payload);

    await axios.post(`${backendUrl}/api/v1/batches/events/ingest`, {
      eventId: `EVT-OFFLINE-${row.id}-${Date.now()}`,
      batchId: payload.batchId || 'BATCH-2026-OFFLINE-SYNC',
      actorId: row.actor_id,
      stage: row.stage,
      payload,
      recordHash: 'offline_generated_hash',
      digitalSignature: 'offline_generated_signature'
    });

    // Remove event from device store upon successful API ingestion
    db.runSync('DELETE FROM pending_events WHERE id = ?;', [row.id]);
    syncedCount++;
  }

  return syncedCount;
}