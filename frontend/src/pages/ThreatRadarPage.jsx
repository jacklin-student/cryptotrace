import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Bug,
  Eye,
  GitBranch,
  FileCheck2,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/Card';
import { RiskBadge, TagBadge } from '../components/Badge';
import { api } from '../api/client';

export function ThreatRadarPage() {
  const [labels, setLabels] = useState([]);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getLabels();
        if (Array.isArray(res)) setLabels(res);
      } catch (err) {
        console.error('Failed to load labels:', err);
      }
    }
    loadData();
  }, []);

  const heuristicModules = [
    {
      id: 'clustering',
      name: 'A. Bitcoin Common-Input Clustering',
      chain: 'BTC Only',
      status: 'Active',
      description: 'Applies multi-input co-spending ownership heuristic using Union-Find. Automatically skips CoinJoin transactions to prevent false clusters. Strictly bypassed on account-based Ethereum.',
      tag: 'COINJOIN FILTERED',
      badge: '92.5% Conf'
    },
    {
      id: 'peel_chain',
      name: 'B. Peel-Chain Detection Engine',
      chain: 'BTC / Multi-Chain',
      status: 'Active',
      description: 'Tracks asymmetric value distribution where >=65% of input value forwards repeatedly to fresh change outputs while small fractions are peeled to unhosted sinks.',
      tag: 'ASYMMETRIC SPLIT',
      badge: 'Hop Depth 4+'
    },
    {
      id: 'mixer',
      name: 'C. Mixer Fan-In / Fan-Out Detection',
      chain: 'ETH / Multi-Chain',
      status: 'Active',
      description: 'Identifies interactions with mixer pools (Tornado Cash, Sinbad), equal-value withdrawal fan-outs, and post-mixer multi-branch recombination by terminal unhosted wallets.',
      tag: 'OFAC SANCTIONED',
      badge: 'Recombination'
    },
    {
      id: 'bridge',
      name: 'D. Cross-Chain Bridge Correlation',
      chain: 'ETH -> Polygon / L2',
      status: 'Active',
      description: 'Temporal window correlation (<30 mins) and value-matching between source bridge contract lock events and destination mint transactions. Formally labeled EXPERIMENTAL.',
      tag: 'EXPERIMENTAL',
      badge: 'Cross-Chain'
    },
    {
      id: 'labels',
      name: 'E. Public Label & OFAC Ground Truth',
      chain: 'All Chains',
      status: 'Active',
      description: 'Deterministic matching against US OFAC SDN sanctions and major exchange hot/cold reserves. Ground-truth rule: Unrecognized nodes strictly remain Unlabeled.',
      tag: 'STRICT GROUND TRUTH',
      badge: 'Zero Hallucination'
    }
  ];

  const filteredLabels = labels.filter((l) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'SANCTIONED') return l.category === 'SANCTIONED_OFAC';
    if (filterCategory === 'EXCHANGE') return l.category === 'EXCHANGE';
    if (filterCategory === 'BRIDGE') return l.category === 'DEFI_BRIDGE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#F2CCB7] rounded-2xl p-6 shadow-ct-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F1] border border-[#F8D2CF] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#C0392B]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#3B2A22]">
              Forensic Heuristic Radar & Pattern Detection
            </h2>
            <p className="text-xs text-[#7A6257]">
              Multi-hop heuristics A-E: Bitcoin clustering, peel-chain tracking, mixer fan-out recombination, and cross-chain bridge correlation
            </p>
          </div>
        </div>
      </div>

      {/* Heuristic Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {heuristicModules.map((mod) => (
          <div
            key={mod.id}
            className="bg-white border border-[#F2CCB7] hover:border-[#D9A98E] rounded-2xl p-5 shadow-ct-sm hover:shadow-ct-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FBEFE7] text-[#3B2A22] border border-[#F2CCB7] font-mono">
                  {mod.chain}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                  {mod.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#3B2A22] mb-1.5">{mod.name}</h3>
              <p className="text-xs text-[#7A6257] leading-relaxed mb-3">
                {mod.description}
              </p>
            </div>
            <div className="pt-3 border-t border-[#FBEFE7] flex items-center justify-between">
              <TagBadge variant="accent">{mod.tag}</TagBadge>
              <span className="text-xs font-mono font-bold text-[#3B2A22]">{mod.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Verified Ground-Truth Labels Registry Table */}
      <Card
        title="Ground-Truth Entity Labeling Registry"
        subtitle="Public exchange reserves, OFAC SDN sanctioned addresses, and verified bridge contracts"
        action={
          <div className="flex items-center gap-1 bg-[#FBEFE7] p-1 rounded-xl border border-[#F2CCB7]">
            {[
              { id: 'ALL', label: 'All Labels' },
              { id: 'SANCTIONED', label: 'OFAC Sanctions' },
              { id: 'EXCHANGE', label: 'Exchanges' },
              { id: 'BRIDGE', label: 'Bridges' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterCategory === cat.id
                    ? 'bg-[#F2CCB7] text-[#3B2A22] shadow-sm'
                    : 'text-[#7A6257] hover:text-[#3B2A22]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="border border-[#F2CCB7] rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FBEFE7] text-[#7A6257] font-bold uppercase text-[10px] border-b border-[#F2CCB7]">
              <tr>
                <th className="p-3">Entity Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Chain</th>
                <th className="p-3">Wallet Address</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Attestation Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FBEFE7]">
              {filteredLabels.map((lbl, idx) => (
                <tr key={idx} className="hover:bg-[#FBEFE7]/40 transition-colors">
                  <td className="p-3 font-bold text-[#3B2A22]">{lbl.entity_name}</td>
                  <td className="p-3">
                    <TagBadge variant={lbl.category === 'SANCTIONED_OFAC' ? 'threat' : 'accent'}>
                      {lbl.category}
                    </TagBadge>
                  </td>
                  <td className="p-3 font-mono font-bold text-[#3B2A22]">{lbl.chain}</td>
                  <td className="p-3 font-mono text-[#7A6257] truncate max-w-[160px]">
                    {lbl.address}
                  </td>
                  <td className="p-3">
                    <RiskBadge level={lbl.risk_level} />
                  </td>
                  <td className="p-3 text-[#7A6257] text-[11px]">{lbl.source_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
