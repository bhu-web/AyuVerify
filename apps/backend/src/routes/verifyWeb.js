const express = require('express');
const router = express.Router();
const axios = require('axios');

// Public Web Portal view for QR Scans
router.get('/:batchId', async (req, res) => {
  const { batchId } = req.params;
  const protocol = req.protocol;
  const host = req.get('host');

  try {
    const apiRes = await axios.get(`${protocol}://${host}/api/v1/batches/verify/${batchId}`);
    const data = apiRes.data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AyuVerify - Batch Verification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9fbf9; margin: 0; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 16px; }
          .authentic { background: #e8f5e9; color: #2e7d32; }
          .suspicious { background: #ffebee; color: #c62828; }
          .timeline { border-left: 2px solid #e0e0e0; padding-left: 16px; margin-top: 20px; }
          .event { margin-bottom: 20px; position: relative; }
          .event::before { content: ''; position: absolute; left: -22px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #2e7d32; }
          .stage-title { font-weight: bold; font-size: 16px; color: #333; }
          .meta { font-size: 13px; color: #666; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>AyuVerify Batch Verification</h2>
          <div class="badge ${data.status === 'AUTHENTIC' ? 'authentic' : 'suspicious'}">
            ${data.status === 'AUTHENTIC' ? '✓ CRYPTOGRAPHICALLY AUTHENTIC' : '⚠ SUSPICIOUS / TAMPERED'}
          </div>
          <p><strong>Batch ID:</strong> ${data.batchId}</p>
          <p><strong>Total Verified Stages:</strong> ${data.totalStages}</p>

          <h3>Provenance Trail</h3>
          <div class="timeline">
            ${data.provenanceChain.map(ev => `
              <div class="event">
                <div class="stage-title">${ev.stage}</div>
                <div class="meta">Actor: ${ev.actorName} (${ev.actorRole})</div>
                <div class="meta">Signature: ${ev.isSignatureValid ? '✅ Verified' : '❌ Invalid'}</div>
                <div class="meta">Date: ${new Date(ev.createdAt).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.status(404).send(`<h2>Batch Verification Error</h2><p>${err.response?.data?.message || 'Batch not found.'}</p>`);
  }
});

module.exports = router;