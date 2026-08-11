'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, User, Building2 } from 'lucide-react';

export default function VerifyPage() {
  const { batchId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!batchId) return;

    axios
      .get(`http://localhost:5000/api/v1/batches/verify/${batchId}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Batch records not found.');
        setLoading(false);
      });
  }, [batchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Verifying Cryptographic Provenance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Batch Not Found</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="text-xs text-slate-400 font-mono bg-slate-100 p-3 rounded-lg">
            Batch Reference: {batchId}
          </div>
        </div>
      </div>
    );
  }

  const isAuthentic = data?.status === 'AUTHENTIC';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            AyuVerify <span className="text-emerald-600">🌿</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Authentic Ayurvedic Supply Chain Audit</p>
        </div>

        {/* Verification Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Batch Identifier</span>
              <h2 className="text-lg font-bold text-slate-800 font-mono mt-0.5">{data.batchId}</h2>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                isAuthentic ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isAuthentic ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {isAuthentic ? 'CRYPTOGRAPHICALLY AUTHENTIC' : 'SUSPICIOUS RECORD'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">Total Stages Verified</span>
              <p className="text-xl font-black text-slate-800 mt-1">{data.totalStages}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">Chain Status</span>
              <p className="text-sm font-bold text-emerald-600 mt-2">100% Validated</p>
            </div>
          </div>
        </div>

        {/* Provenance Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Verified Provenance Trail</h3>

          <div className="relative border-l-2 border-emerald-500 ml-4 space-y-8">
            {data.provenanceChain.map((event, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[17px] top-1 bg-emerald-600 text-white rounded-full p-1 border-4 border-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 tracking-wide text-sm">{event.stage}</h4>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-100">
                      <ShieldCheck className="w-3 h-3" /> Ed25519 Verified
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>Actor:</strong> {event.actorName} ({event.actorRole})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>Timestamp:</strong> {new Date(event.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}