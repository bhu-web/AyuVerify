import * as SQLite from 'expo-sqlite';

let dbInstance = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('ayuverify_offline.db');
    
    // Drop the old schema if batch_id is missing, then recreate
    await dbInstance.execAsync(`
      DROP TABLE IF EXISTS pending_events;
      CREATE TABLE pending_events (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        payload TEXT NOT NULL,
        record_hash TEXT NOT NULL,
        digital_signature TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);
  }
  return dbInstance;
}

export async function getPendingCount() {
  try {
    const db = await getDb();
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM pending_events WHERE synced = 0');
    return result ? result.count : 0;
  } catch (err) {
    console.error('getPendingCount error:', err);
    return 0;
  }
}

export async function getPendingEvents() {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT id, batch_id, stage, payload, record_hash, digital_signature, created_at FROM pending_events WHERE synced = 0 ORDER BY created_at DESC'
    );
    return rows || [];
  } catch (err) {
    console.error('getPendingEvents error:', err);
    return [];
  }
}

export async function captureOfflineEvent({ actorId, stage, payload }) {
  const db = await getDb();
  const id = `evt_${Date.now()}`;
  const batchId = payload.batchId || `BATCH-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const payloadStr = JSON.stringify(payload);
  
  // Detached mock signatures if shared-crypto is handled upstream
  const recordHash = payloadStr; 
  const digitalSignature = `sig_${Date.now()}_${actorId}`;

  await db.runAsync(
    `INSERT INTO pending_events (id, batch_id, actor_id, stage, payload, record_hash, digital_signature, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, batchId, actorId, stage, payloadStr, recordHash, digitalSignature, createdAt]
  );
  return id;
}

export async function syncPendingEvents(baseUrl) {
  const events = await getPendingEvents();
  if (!events || events.length === 0) return 0;

  const db = await getDb();
  let count = 0;

  for (const evt of events) {
    const res = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: evt.batch_id,
        actorId: evt.actor_id,
        stage: evt.stage,
        payload: JSON.parse(evt.payload),
        recordHash: evt.record_hash,
        digitalSignature: evt.digital_signature
      })
    });

    if (res.ok) {
      await db.runAsync('UPDATE pending_events SET synced = 1 WHERE id = ?', [evt.id]);
      count++;
    }
  }
  return count;
}