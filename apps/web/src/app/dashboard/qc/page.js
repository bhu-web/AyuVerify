'use client';

import { useState } from 'react';
import axios from 'axios';
import { FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function QCDashboard() {
  const [batchId, setBatchId] = useState('');
  const [certId, setCertId] = useState('');
  const [purity, setPurity] = useState('99.2');
  const [heavyMetals, setHeavyMetals] = useState(true);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', message: 'Submitting signed laboratory report...' });

    try {
      // In production, payload signing happens via shared-crypto using the user's private key
      await axios.post('http://localhost:5000/api/v1/batches/events/ingest', {
        eventId: `EVT-QC-${Date.now()}`,
        batchId,
        actorId: 'QCLAB_01',
        stage: 'QC_TESTING',
        payload: {
          testCertificateId: certId,
          purityPercent: parseFloat(purity),
          heavyMetalsPassed: heavyMetals,
          labResult: heavyMetals && parseFloat(purity) > 95 ? 'PASSED' : 'FAILED'
        },
        recordHash: 'demo_hash_value',
        digitalSignature: 'demo_signature_value'
      });

      setStatus({ type: 'success', message: 'QC Analysis cryptographically logged and attached to batch!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-emerald-600" /> Quality Control Laboratory
        </h1>
        <p className="text-slate-500 text-sm">Upload certified chemical analysis and heavy metal test verification</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Target Batch ID</label>
          <input
            type="text"
            required
            placeholder="e.g. BATCH-2026-ASHWA-..."
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Certificate ID</label>
            <input
              type="text"
              required
              placeholder="e.g. CERT-99823"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Purity Percentage (%)</label>
            <input
              type="number"
              step="0.1"
              required
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="heavyMetals"
            checked={heavyMetals}
            onChange={(e) => setHeavyMetals(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          <label htmlFor="heavyMetals" className="text-xs font-medium text-slate-700">
            Heavy Metals Clearance Passed (Lead, Mercury, Arsenic)
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          Sign & Log QC Certificate
        </button>
      </form>

      {status && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {status.message}
        </div>
      )}
    </div>
  );
}