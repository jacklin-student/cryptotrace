import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DataModeBadge } from './Badge';
import { api } from '../api/client';

export function TopBar({ dataMode, onSearch, currentInvestigation }) {
  const [query, setQuery] = useState('');
  const [detection, setDetection] = useState(null);
  const [validating, setValidating] = useState(false);

  // Debounced real-time identifier validation
  useEffect(() => {
    if (!query.trim()) {
      setDetection(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await api.validateIdentifier(query.trim());
        setDetection(res);
      } catch (err) {
        // Fallback local regex if backend is uncontactable
        const isEth = query.startsWith('0x');
        setDetection({
          valid: query.length >= 26,
          chain: isEth ? 'ETH' : 'BTC',
          type: query.length > 50 ? 'tx_hash' : 'address',
          format: isEth ? 'Ethereum' : 'Bitcoin',
          error: null
        });
      } finally {
        setValidating(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (detection && !detection.valid) {
      alert(`Invalid format: ${detection.error || 'Please enter a valid BTC/ETH address or transaction hash.'}`);
      return;
    }
    onSearch(query.trim(), detection);
  };

  return (
    <header className="h-16 bg-white border-b border-[#F2CCB7] px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm ml-64">
      {/* Search Bar with Chain / Type Detection Pill */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#7A6257] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter BTC / ETH address or transaction hash to trace..."
            className={`w-full bg-[#FBEFE7] hover:bg-[#FBEFE7]/80 focus:bg-white text-sm text-[#3B2A22] placeholder-[#7A6257] pl-10 ${
              detection?.valid ? 'pr-36' : 'pr-24'
            } py-2 rounded-xl border ${
              detection && !detection.valid && query.length > 5
                ? 'border-[#C0392B] focus:border-[#C0392B]'
                : 'border-[#F2CCB7] focus:border-[#D9A98E]'
            } focus:outline-none focus:ring-2 focus:ring-[#F2CCB7]/50 transition-all font-mono`}
          />

          {/* Real-time Detection Status Badge */}
          {detection && query.trim() && (
            <div className="absolute right-20 flex items-center gap-1.5 pointer-events-none">
              {detection.valid ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{detection.chain} • {detection.type === 'tx_hash' ? 'Tx' : 'Addr'}</span>
                </span>
              ) : (
                query.length > 10 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF2F1] text-[#C0392B] border border-[#F8D2CF] flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>Invalid</span>
                  </span>
                )
              )}
            </div>
          )}

          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1 bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>Trace</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Right Action Group */}
      <div className="flex items-center gap-4 ml-4">
        {/* Active Investigation Pill if exists */}
        {currentInvestigation && (
          <div className="hidden lg:flex items-center gap-2 bg-[#FBEFE7] border border-[#F2CCB7] px-3 py-1 rounded-full text-xs font-mono text-[#3B2A22]">
            <span className="w-2 h-2 rounded-full bg-[#3E9B6B]" />
            <span className="font-semibold truncate max-w-[150px]">
              {currentInvestigation.id || 'Active Trace'}
            </span>
          </div>
        )}

        {/* Global Data Mode Badge */}
        <DataModeBadge mode={dataMode} />

        {/* Forensic Standards Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#7A6257] bg-white border border-[#F2CCB7] px-2.5 py-1 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3E9B6B]" />
          <span className="font-medium">Probabilistic Forensics</span>
        </div>
      </div>
    </header>
  );
}
