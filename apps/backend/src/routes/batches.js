const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { verifyEventSignature } = require('../middlewares/verifySignature');
const { verifySignature } = require('@ayuverify/shared-crypto');

// 1. Create New Batch (Farmer / Collector)
router.post('/create', (req, res) => {
  const { batchId, species, originDistrict, collectorId } = req.body;

  if (!batchId || !species || !originDistrict || !collectorId) {
    return res.status(400).json({ error: 'All batch fields are required' });
  }

  const query = `
    INSERT INTO batches (batch_id, species, origin_district, collector_id)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [batchId, species, originDistrict, collectorId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Batch registered successfully', batchId });
  });
});

// 2. Log Signed Traceability Event (Ingestion Endpoint)
router.post('/events/ingest', verifyEventSignature, (req, res) => {
  const { eventId, batchId, actorId, stage, payload, recordHash, digitalSignature } = req.body;

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const query = `
    INSERT INTO event_records (event_id, batch_id, actor_id, stage, payload_json, record_hash, digital_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [eventId, batchId, actorId, stage, payloadString, recordHash, digitalSignature],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ 
        message: 'Signed traceability event verified and recorded successfully',
        eventId 
      });
    }
  );
});

// 3. Retrieve Full Batch Lineage / Audit Trail
router.get('/:batchId/lineage', (req, res) => {
  const { batchId } = req.params;

  const batchQuery = `
    SELECT b.*, u.name as collector_name 
    FROM batches b 
    JOIN users u ON b.collector_id = u.id 
    WHERE b.batch_id = ?
  `;

  db.get(batchQuery, [batchId], (err, batch) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const eventsQuery = `
      SELECT e.*, u.name as actor_name, u.role as actor_role, u.public_key
      FROM event_records e
      JOIN users u ON e.actor_id = u.id
      WHERE e.batch_id = ?
      ORDER BY e.created_at ASC
    `;

    db.all(eventsQuery, [batchId], (err, events) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        batch,
        events: events.map((ev) => ({
          ...ev,
          payload_json: JSON.parse(ev.payload_json)
        }))
      });
    });
  });
});

// 4. Public Consumer QR Verification Endpoint
router.get('/verify/:batchId', (req, res) => {
  const { batchId } = req.params;

  const query = `
    SELECT e.*, u.name as actor_name, u.role as actor_role, u.public_key
    FROM event_records e
    JOIN users u ON e.actor_id = u.id
    WHERE e.batch_id = ?
    ORDER BY e.created_at ASC
  `;

  db.all(query, [batchId], async (err, events) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!events || events.length === 0) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: 'No traceability records found for this batch identifier.' 
      });
    }

    let isChainAuthentic = true;
    const verifiedEvents = [];

    // Re-verify every cryptographic signature in the provenance chain
    for (const ev of events) {
      const isValid = await verifySignature(ev.record_hash, ev.digital_signature, ev.public_key);
      if (!isValid) {
        isChainAuthentic = false;
      }

      verifiedEvents.push({
        eventId: ev.event_id,
        stage: ev.stage,
        actorName: ev.actor_name,
        actorRole: ev.actor_role,
        payload: JSON.parse(ev.payload_json),
        createdAt: ev.created_at,
        isSignatureValid: isValid
      });
    }

    res.json({
      batchId,
      status: isChainAuthentic ? 'AUTHENTIC' : 'SUSPICIOUS_TAMPERED',
      totalStages: verifiedEvents.length,
      provenanceChain: verifiedEvents
    });
  });
});

module.exports = router;