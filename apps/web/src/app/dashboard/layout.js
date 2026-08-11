'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, Factory, PackageCheck, ShieldCheck } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'QC Testing Lab', href: '/dashboard/qc', icon: FlaskConical },
    { name: 'Processing Plant', href: '/dashboard/processor', icon: Factory },
    { name: 'Manufacturing & Packaging', href: '/dashboard/manufacturer', icon: PackageCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg tracking-wide">AyuVerify Enterprise Portal</span>
        </div>
        <div className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
          Environment: Local Dev
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-2 hidden md:block">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Stakeholder Portals
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}