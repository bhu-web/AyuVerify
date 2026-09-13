'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

// Change from Render to your local backend:
const API_URL = 'http://localhost:5000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('ayu_token', data.token);
      localStorage.setItem('ayu_user', JSON.stringify(data.user));

      switch (data.user.role) {
        case 'PROCESSOR':
          router.push('/dashboard/processor');
          break;
        case 'QC_LAB':
          router.push('/dashboard/qc');
          break;
        case 'MANUFACTURER':
          router.push('/dashboard/manufacturer');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 mb-3 text-2xl">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AyuVerify Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Cryptographic Provenance for Ayurvedic Herbs</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. processor@ayuverify.org"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition"
          >
            {loading ? 'Authenticating...' : 'Sign In & Access Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center mb-3">Quick Demo Presets</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('processor@ayuverify.org', 'password123')}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium border border-slate-700/60 transition"
            >
              Processor
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('qc@ayuverify.org', 'password123')}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium border border-slate-700/60 transition"
            >
              QC Lab
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('manufacturer@ayuverify.org', 'password123')}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium border border-slate-700/60 transition"
            >
              Manufacturer
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}