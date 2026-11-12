import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  ShieldAlert,
  FileCheck2,
  FileText,
  Database,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, dataMode, setDataMode }) {
  const navItems = [
    { id: 'dashboard', label: 'Forensic Dashboard', icon: LayoutDashboard },
    { id: 'investigation', label: 'Multi-Hop Trace', icon: GitFork },
    { id: 'threats', label: 'Cyber Threat Radar', icon: ShieldAlert },
    { id: 'audit', label: 'Tamper Audit Chain', icon: FileCheck2 },
    { id: 'reports', label: 'Forensic Reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#F2CCB7] flex flex-col h-screen fixed left-0 top-0 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#F2CCB7] bg-[#FBEFE7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F2CCB7] border border-[#D9A98E] flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-6 h-6 text-[#3B2A22]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#3B2A22] leading-none">
              CryptoTrace
            </h1>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#7A6257] mt-1">
              Forensics Engine
            </p>
          </div>
        </div>
        <p className="text-[11px] text-[#7A6257] mt-2.5 line-clamp-2 leading-relaxed">
          Probabilistic end-receiver tracing & adversarial threat detection
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#7A6257]">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2CCB7] text-[#3B2A22] shadow-sm border border-[#D9A98E]'
                  : 'text-[#3B2A22] hover:bg-[#FBEFE7] hover:text-[#3B2A22] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#3B2A22]' : 'text-[#7A6257]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-[#3B2A22]" />}
            </button>
          );
        })}
      </nav>

      {/* Mode Switcher & System Telemetry Footer */}
      <div className="p-4 border-t border-[#F2CCB7] bg-[#FBEFE7] space-y-3">
        {/* Mode Toggle */}
        <div className="bg-white p-2 rounded-xl border border-[#F2CCB7]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#7A6257] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D9A98E]" /> Pipeline Mode
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                dataMode === 'DEMO'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {dataMode}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setDataMode('DEMO')}
              className={`text-xs py-1 px-2 rounded-lg font-bold transition-all ${
                dataMode === 'DEMO'
                  ? 'bg-[#F2CCB7] text-[#3B2A22] shadow-sm'
                  : 'text-[#7A6257] hover:bg-[#FBEFE7]'
              }`}
            >
              Demo Data
            </button>
            <button
              type="button"
              onClick={() => setDataMode('ON-CHAIN')}
              className={`text-xs py-1 px-2 rounded-lg font-bold transition-all ${
                dataMode === 'ON-CHAIN'
                  ? 'bg-[#D9A98E] text-[#3B2A22] shadow-sm'
                  : 'text-[#7A6257] hover:bg-[#FBEFE7]'
              }`}
            >
              On-Chain
            </button>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center justify-between text-[11px] text-[#7A6257] px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3E9B6B]" />
            <span>SQLite Forensics DB</span>
          </div>
          <span className="font-mono text-[10px] font-bold text-[#3B2A22]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
