const { verifySignature } = require('@ayuverify/shared-crypto');
const { db } = require('../config/db');

/**
 * Middleware to verify that the submitted event hash and digital signature
 * match the stakeholder's public key stored in the database.
 */
const verifyEventSignature = async (req, res, next) => {
  try {
    const { actorId, payload, recordHash, digitalSignature } = req.body;

    if (!actorId || !payload || !recordHash || !digitalSignature) {
      return res.status(400).json({ 
        error: 'actorId, payload, recordHash, and digitalSignature are required' 
      });
    }

    // 1. Fetch actor's public key from database
    db.get('SELECT public_key FROM users WHERE id = ?', [actorId], async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'Actor user record not found' });

      // 2. Validate digital signature against recordHash and public key
      const isValid = await verifySignature(recordHash, digitalSignature, user.public_key);

      if (!isValid) {
        console.warn(`⚠️ [REJECTED] Signature verification failed for actor: ${actorId}`);
        return res.status(401).json({ 
          error: 'Signature verification failed. Record integrity compromised or unauthorized key.' 
        });
      }

      req.actorPublicKey = user.public_key;
      next();
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { verifyEventSignature };