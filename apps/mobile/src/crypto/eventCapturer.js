import { hashPayload, signHash } from '@ayuverify/shared-crypto';
import { queueEventLocally } from '../database/db';

/**
 * Capture, hash, sign, and store a supply chain event locally
 */
export const captureAndQueueEvent = async ({
  batchId,
  actorId,
  stage,
  payloadData,
  privateKeyBase64
}) => {
  const eventId = `EVT-${Date.now()}`;
  
  const fullPayload = {
    eventId,
    batchId,
    actorId,
    stage,
    timestamp: new Date().toISOString(),
    data: payloadData
  };

  // 1. Generate SHA-256 canonical payload hash
  const recordHash = await hashPayload(fullPayload);

  // 2. Sign hash with stakeholder private key
  const digitalSignature = await signHash(recordHash, privateKeyBase64);

  // 3. Persist signed record locally for offline sync
  const eventRecord = {
    eventId,
    batchId,
    actorId,
    stage,
    payload: fullPayload,
    recordHash,
    digitalSignature
  };

  queueEventLocally(eventRecord);

  return eventRecord;
};