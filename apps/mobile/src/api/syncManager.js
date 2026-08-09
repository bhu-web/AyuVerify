import axios from 'axios';
import { getPendingEvents, markEventSynced } from '../database/db';

const BACKEND_URL = 'http://10.0.2.2:5000/api/v1'; // 10.0.2.2 points to localhost for Android Emulator

/**
 * Synchronize all locally stored offline events to central server
 */
export const synchronizeOfflineEvents = async () => {
  const pendingEvents = getPendingEvents();

  if (pendingEvents.length === 0) {
    console.log('✅ No pending events to synchronize');
    return { syncedCount: 0 };
  }

  console.log(`🔄 Attempting to sync ${pendingEvents.length} queued events...`);
  let syncedCount = 0;

  for (const event of pendingEvents) {
    try {
      const payloadObj = JSON.parse(event.payload_json);

      const response = await axios.post(`${BACKEND_URL}/batches/events/ingest`, {
        eventId: event.event_id,
        batchId: event.batch_id,
        actorId: event.actor_id,
        stage: event.stage,
        payload: payloadObj,
        recordHash: event.record_hash,
        digitalSignature: event.digital_signature
      });

      if (response.status === 201) {
        markEventSynced(event.event_id);
        syncedCount++;
        console.log(`✅ Event ${event.event_id} synced successfully`);
      }
    } catch (error) {
      console.error(`❌ Sync failed for event ${event.event_id}:`, error.response?.data || error.message);
      // Stop sequential execution on failure to preserve batch order
      break;
    }
  }

  return { syncedCount, remaining: pendingEvents.length - syncedCount };
};