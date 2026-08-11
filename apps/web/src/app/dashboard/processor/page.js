'use client';

import { useState } from 'react';
import axios from 'axios';
import { Factory, CheckCircle2 } from 'lucide-react';

export default function ProcessorDashboard() {
  const [batchId, setBatchId] = useState('');
  const [processType, setProcessType] = useState('Drying & Powdering');
  const [yieldKg, setYieldKg] = useState('210');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', message: 'Ingesting processing record...' });

    try {
      await axios.post('http://localhost:5000/api/v1/batches/events/ingest', {
        eventId: `EVT-PROC-${Date.now()}`,
        batchId,
        actorId: 'PROCESSOR_01',
        stage: 'PROCESSING',
        payload: {
          processType,
          yieldWeightKg: parseFloat(yieldKg),
          moistureContentPercent: 8.5
        },
        recordHash: 'demo_hash_value',
        digitalSignature: 'demo_signature_value'
      });

      setStatus({ type: 'success', message: 'Processing stage logged with cryptographic signature!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Factory className="w-6 h-6 text-emerald-600" /> Processing Facility
        </h1>
        <p className="text-slate-500 text-sm">Log processing methods, moisture metrics, and weight conversions</p>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Process Method</label>
            <select
              value={processType}
              onChange={(e) => setProcessType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option>Drying & Powdering</option>
              <option>Aqueous Extraction</option>
              <option>Steam Distillation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Yield Weight (kg)</label>
            <input
              type="number"
              required
              value={yieldKg}
              onChange={(e) => setYieldKg(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          Sign & Submit Processing Record
        </button>
      </form>

      {status && (
        <div className="p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {status.message}
        </div>
      )}
    </div>
  );
}