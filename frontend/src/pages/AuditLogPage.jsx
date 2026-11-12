import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Hash,
  Clock,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/Card';
import { TagBadge } from '../components/Badge';
import { api } from '../api/client';

export function AuditLogPage() {
  const [investigationId, setInvestigationId] = useState('INV-DEMO-PEEL-CHAIN');
  const [entries, setEntries] = useState([]);
  const [chainValid, setChainValid] = useState(true);
  const [tamperedIndex, setTamperedIndex] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Chain integrity confirmed via SHA-256 verification.');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadAuditTrail(investigationId);
  }, [investigationId]);

  const loadAuditTrail = async (invId) => {
    setLoading(true);
    try {
      const trail = await api.getAuditLog(invId);
      if (Array.isArray(trail)) {
        setEntries(trail);
      }
      // Live verify on load
      const verifyRes = await api.verifyAuditLog({ investigation_id: invId });
      setChainValid(verifyRes.is_valid);
      setStatusMessage(verifyRes.message);
      setTamperedIndex(verifyRes.broken_at_index);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const verifyRes = await api.verifyAuditLog({ investigation_id: investigationId });
      setChainValid(verifyRes.is_valid);
      setStatusMessage(verifyRes.message);
      setTamperedIndex(verifyRes.broken_at_index);
      // Reload entries to reflect any changes
      const trail = await api.getAuditLog(investigationId);
      if (Array.isArray(trail)) setEntries(trail);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      const res = await api.simulateTamper({
        investigation_id: investigationId,
        entry_index: 1
      });
      setTamperedIndex(res.tampered_index);
      setChainValid(false);
      setStatusMessage(res.verification_result?.message || 'Tamper detected: Block payload hash mismatch!');
      // Reload trail
      const trail = await api.getAuditLog(investigationId);
      if (Array.isArray(trail)) setEntries(trail);
    } catch (err) {
      console.error('Tampering simulation failed:', err);
    }
  };

  const handleReset = async () => {
    // Reset by reloading fresh investigation trail
    await loadAuditTrail(investigationId);
  };

  return (
    <div className="space-y-6">
      {/* Header and Integrity Status */}
      <div className="bg-white border border-[#F2CCB7] rounded-2xl p-6 shadow-ct-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
              chainValid ? 'bg-[#D1FAE5] border-[#A7F3D0] text-[#065F46]' : 'bg-[#FDF2F1] border-[#F8D2CF] text-[#C0392B]'
            }`}>
              {chainValid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6257] bg-[#FBEFE7] px-2 py-0.5 rounded border border-[#F2CCB7]">
                  Case: {investigationId}
                </span>
                <span className="text-[10px] font-mono text-[#7A6257]">
                  {entries.length} Cryptographic Blocks
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#3B2A22]">
                Cryptographic Audit Log & SHA-256 Hash Chain
              </h2>
              <p className="text-xs text-[#7A6257]">
                Tamper-evident verification of forensic investigation history and evidence integrity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2 bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] text-xs font-bold rounded-xl border border-[#D9A98E] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>Verify Chain</span>
            </button>
            <button
              onClick={handleSimulateTamper}
              className="px-4 py-2 bg-[#FDF2F1] hover:bg-[#F8D2CF] text-[#C0392B] text-xs font-bold rounded-xl border border-[#F8D2CF] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Simulate Tampering</span>
            </button>
            {tamperedIndex !== null && (
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-[#FBEFE7] text-[#7A6257] hover:text-[#3B2A22] text-xs font-bold rounded-xl border border-[#F2CCB7] transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Chain Integrity Banner */}
        <div className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
          chainValid
            ? 'bg-[#EBF7F0] border-[#C2E7D3] text-[#3E9B6B]'
            : 'bg-[#FDF2F1] border-[#F8D2CF] text-[#C0392B]'
        }`}>
          <div className="flex items-center gap-2">
            {chainValid ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertOctagon className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMessage}</span>
          </div>
          <span className="font-mono text-[11px] bg-white/70 px-2 py-0.5 rounded border border-current">
            {chainValid ? 'VERIFIED INTACT' : `BROKEN AT BLOCK #${tamperedIndex}`}
          </span>
        </div>
      </div>

      {/* Hash Chain Records List */}
      <div className="space-y-4">
        {entries.map((item, idx) => {
          const isBroken = !chainValid && (item.entry_index === tamperedIndex || (tamperedIndex !== null && item.entry_index >= tamperedIndex));
          return (
            <div
              key={item.entry_index}
              className={`bg-white border rounded-2xl p-5 shadow-ct-sm transition-all ${
                isBroken
                  ? 'border-[#C0392B] bg-[#FFF5F5] ring-2 ring-[#C0392B]/20'
                  : 'border-[#F2CCB7] hover:border-[#D9A98E]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-lg text-xs font-mono font-extrabold flex items-center justify-center ${
                    isBroken ? 'bg-[#C0392B] text-white' : 'bg-[#3B2A22] text-white'
                  }`}>
                    #{item.entry_index}
                  </span>
                  <TagBadge variant={isBroken ? 'threat' : 'accent'}>{item.action}</TagBadge>
                  <span className="text-xs text-[#7A6257] font-mono">Actor: {item.actor}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7A6257]">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono">{item.timestamp}</span>
                </div>
              </div>

              {/* Payload Details */}
              <div className="bg-[#FBEFE7] p-3 rounded-xl border border-[#F2CCB7]/60 mb-3 text-xs text-[#3B2A22] font-mono leading-relaxed overflow-x-auto">
                <pre className="whitespace-pre-wrap font-sans text-xs">
                  {typeof item.payload === 'object' ? JSON.stringify(item.payload, null, 2) : String(item.payload)}
                </pre>
              </div>

              {/* Hashes: Previous Block Hash -> Current SHA-256 Digest */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-[#7A6257] uppercase font-bold block mb-0.5">
                    Previous Block Hash:
                  </span>
                  <span className="text-[11px] text-[#7A6257] break-all">{item.prev_hash}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${
                  isBroken ? 'bg-red-50 border-red-200 text-red-900' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}>
                  <span className="text-[10px] text-[#7A6257] uppercase font-bold block mb-0.5">
                    Current SHA-256 Hash Digest:
                  </span>
                  <span className="text-[11px] font-bold break-all">{item.current_hash}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
