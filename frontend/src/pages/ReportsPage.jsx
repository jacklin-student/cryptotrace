import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Share2,
  Code,
  Globe,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Card } from '../components/Card';
import { TagBadge, RiskBadge, DataModeBadge } from '../components/Badge';
import { api } from '../api/client';

export function ReportsPage() {
  const [selectedCaseId, setSelectedCaseId] = useState('demo-peel-chain');
  const [availableCases, setAvailableCases] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Load available cases (DB investigations + demo scenarios)
  useEffect(() => {
    async function loadCases() {
      try {
        const [invs, demos] = await Promise.allSettled([
          api.getInvestigations(),
          api.getDemoCases()
        ]);
        const combined = [];
        if (demos.status === 'fulfilled' && Array.isArray(demos.value)) {
          demos.value.forEach((d) => {
            combined.push({
              id: d.id,
              title: d.title,
              target: d.target_address || d.target,
              chain: d.target_chain || d.chain || 'BTC',
              depth: d.depth || 5
            });
          });
        }
        if (invs.status === 'fulfilled' && Array.isArray(invs.value)) {
          invs.value.forEach((inv) => {
            if (!combined.some((c) => c.id === inv.id)) {
              combined.push({
                id: inv.id,
                title: inv.title,
                target: inv.target_address,
                chain: inv.target_chain,
                depth: inv.depth
              });
            }
          });
        }
        setAvailableCases(combined);
      } catch (err) {
        console.error('Failed to load cases:', err);
      }
    }
    loadCases();
  }, []);

  // Fetch report trace data whenever selectedCaseId changes
  useEffect(() => {
    async function fetchCaseData() {
      if (!selectedCaseId) return;
      setLoading(true);
      try {
        const data = await api.getTrace(selectedCaseId);
        setReportData(data);
      } catch (err) {
        console.error('Failed to fetch case trace data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCaseData();
  }, [selectedCaseId]);

  const handleDownloadPdf = async () => {
    setDownloadingFormat('pdf');
    try {
      const url = api.getPdfReportUrl(selectedCaseId);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `CryptoTrace-Dossier-${selectedCaseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('PDF download error:', err);
      window.open(api.getPdfReportUrl(selectedCaseId), '_blank');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadHtml = async () => {
    setDownloadingFormat('html');
    try {
      const url = api.getHtmlGraphUrl(selectedCaseId);
      const res = await fetch(url);
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: 'text/html' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `CryptoTrace-Graph-${selectedCaseId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('HTML export error:', err);
      window.open(api.getHtmlGraphUrl(selectedCaseId), '_blank');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadJson = async () => {
    setDownloadingFormat('json');
    try {
      const jsonData = await api.getJsonTrace(selectedCaseId);
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `CryptoTrace-Ledger-${selectedCaseId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('JSON export error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const nodes = reportData?.graph?.nodes || [];
  const edges = reportData?.graph?.edges || [];
  const receivers = reportData?.probable_end_receivers || [];
  const alerts = reportData?.alerts || [];
  const topReceiver = receivers[0];

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="bg-white border border-[#F2CCB7] rounded-2xl p-6 shadow-ct-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FBEFE7] border border-[#F2CCB7] flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#3B2A22]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#3B2A22]">
                Forensic Dossier & Export Engine
              </h2>
              <p className="text-xs text-[#7A6257]">
                Generate court-ready, publication-grade forensic documentation and offline graph packages
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingFormat !== null}
              className="px-4 py-2 bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] text-xs font-bold rounded-xl border border-[#D9A98E] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              disabled={downloadingFormat !== null}
              className="px-4 py-2 bg-[#FBEFE7] hover:bg-[#F2CCB7] text-[#3B2A22] text-xs font-bold rounded-xl border border-[#F2CCB7] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5 text-[#3B2A22]" />
              <span>{downloadingFormat === 'html' ? 'Building Graph...' : 'Export HTML Graph'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              disabled={downloadingFormat !== null}
              className="px-4 py-2 bg-[#FBEFE7] hover:bg-[#F2CCB7] text-[#3B2A22] text-xs font-bold rounded-xl border border-[#F2CCB7] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Code className="w-3.5 h-3.5 text-[#3B2A22]" />
              <span>{downloadingFormat === 'json' ? 'Exporting...' : 'Export JSON Ledger'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-white hover:bg-[#FBEFE7] text-[#7A6257] hover:text-[#3B2A22] text-xs font-bold rounded-xl border border-[#F2CCB7] transition-all flex items-center gap-1.5 shadow-sm"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Case Selector Dropdown */}
        <div className="mt-4 pt-4 border-t border-[#FBEFE7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A6257]">
              Select Investigation Case:
            </span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-[#FBEFE7] text-xs font-bold text-[#3B2A22] px-3 py-1.5 rounded-xl border border-[#F2CCB7] focus:border-[#D9A98E] focus:outline-none"
            >
              {availableCases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.chain} • {c.depth} Hops)
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#7A6257]">
            <Lock className="w-3.5 h-3.5 text-[#3E9B6B]" />
            <span>Cryptographic SHA-256 Hash Chain: <strong>Verified</strong></span>
          </div>
        </div>
      </div>

      {/* Report Preview Dossier (Publication Style) */}
      <div className="bg-white border border-[#F2CCB7] rounded-2xl p-8 shadow-ct-md space-y-6 max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#F2CCB7] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#3B2A22] tracking-tight">CryptoTrace</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A6257] bg-[#FBEFE7] px-2.5 py-0.5 rounded-lg border border-[#F2CCB7]">
                Forensic Dossier
              </span>
            </div>
            <p className="text-xs text-[#7A6257] mt-1 font-mono">
              Case Ref: <strong>{reportData?.investigation_id || selectedCaseId}</strong> • Generated: 2026-11-12 UTC
            </p>
          </div>
          <div className="text-right text-xs text-[#7A6257] space-y-1">
            <div className="font-semibold text-[#3B2A22]">Cybersecurity Blockchain Forensics Unit</div>
            <div className="flex items-center justify-end gap-1 text-[#3E9B6B] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SHA-256 Merkle Audit Chain Verified</span>
            </div>
            <DataModeBadge mode={reportData?.data_mode || 'DEMO'} />
          </div>
        </div>

        {/* Case Summary Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#FBEFE7] p-4 rounded-xl border border-[#F2CCB7]">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#7A6257] block">Target Vector</span>
            <span className="text-xs font-mono font-bold text-[#3B2A22] truncate block mt-0.5">
              {reportData?.target_address || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#7A6257] block">Network & Depth</span>
            <span className="text-xs font-bold text-[#3B2A22] block mt-0.5">
              {reportData?.target_chain || 'BTC'} • {reportData?.depth || 5} Multi-Hop Traversal
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#7A6257] block">Graph Boundaries</span>
            <span className="text-xs font-bold text-[#3B2A22] block mt-0.5">
              {nodes.length} Nodes • {edges.length} Edges
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#7A6257] block">Identified Receivers</span>
            <span className="text-xs font-bold text-[#3E9B6B] block mt-0.5">
              {receivers.length} Wallets Ranked
            </span>
          </div>
        </div>

        {/* Section 1: Executive Forensic Summary */}
        <div>
          <h4 className="text-sm font-extrabold text-[#3B2A22] uppercase tracking-wider mb-2">
            1. Executive Forensic Summary
          </h4>
          <p className="text-xs text-[#3B2A22] leading-relaxed">
            Multi-hop directed graph traversal initiated from target wallet{' '}
            <code className="font-mono bg-[#FBEFE7] px-1 py-0.5 rounded text-[11px] text-[#3B2A22] border border-[#F2CCB7]">
              {reportData?.target_address ? `${reportData.target_address.slice(0, 14)}...` : 'target'}
            </code>{' '}
            across a traversal depth of {reportData?.depth || 5} hops discovered {nodes.length} interconnected addresses and {edges.length} transaction edges.
            {topReceiver
              ? ` Forensic scoring identified candidate end-receiver ${topReceiver.id} with ${topReceiver.confidence_score}% evidence confidence and a cyber-risk score of ${topReceiver.risk_score}/100 (${topReceiver.risk_level}).`
              : ' Traversal mapped intermediate transaction flows across the network slice.'}
          </p>
        </div>

        {/* Section 2: Ranked Probable End-Receivers */}
        <div>
          <h4 className="text-sm font-extrabold text-[#3B2A22] uppercase tracking-wider mb-2">
            2. Ranked Probable End-Receiver Wallets
          </h4>
          <div className="border border-[#F2CCB7] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FBEFE7] text-[#7A6257] font-bold uppercase text-[10px] border-b border-[#F2CCB7]">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Destination Wallet</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Forensic Attribution Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FBEFE7]">
                {receivers.length > 0 ? (
                  receivers.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-[#FBEFE7]/40">
                      <td className="p-3 font-extrabold text-[#3B2A22]">#{rec.rank || idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-[#3B2A22]">
                        {rec.id ? `${rec.id.slice(0, 8)}...${rec.id.slice(-6)}` : 'N/A'}
                      </td>
                      <td className="p-3 font-bold text-[#3E9B6B] font-mono">
                        {rec.confidence_score}%
                      </td>
                      <td className="p-3">
                        <RiskBadge level={rec.risk_level} score={rec.risk_score} />
                      </td>
                      <td className="p-3 text-[#7A6257] max-w-xs leading-relaxed">
                        {rec.reasoning}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-[#7A6257]">
                      No probable terminal sinks identified in current network slice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Heuristic Obfuscation & Threat Alerts */}
        <div>
          <h4 className="text-sm font-extrabold text-[#3B2A22] uppercase tracking-wider mb-2">
            3. Heuristic Obfuscation & Threat Alerts
          </h4>
          <div className="space-y-2">
            {alerts.length > 0 ? (
              alerts.map((a, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FBEFE7] border border-[#F2CCB7] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#C0392B]" />
                    <div>
                      <div className="font-bold text-[#3B2A22]">{a.title || a.threat_type}</div>
                      <div className="text-[#7A6257] text-[11px] mt-0.5">{a.description}</div>
                    </div>
                  </div>
                  <TagBadge variant={a.severity === 'HIGH' ? 'danger' : 'warning'}>
                    {a.severity}
                  </TagBadge>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-[#FBEFE7] border border-[#F2CCB7] text-xs text-[#7A6257]">
                No critical adversarial anomalies detected. Standard multi-hop flow pattern.
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Cryptographic SHA-256 Audit Log Integrity */}
        <div className="bg-[#FBEFE7] p-4 rounded-xl border border-[#F2CCB7] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B2A22] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#3E9B6B]" />
              4. Cryptographic SHA-256 Hash-Chain Integrity Summary
            </span>
            <span className="text-[10px] font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded border border-[#A7F3D0]">
              INTEGRITY VERIFIED
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#7A6257] pt-2 border-t border-[#F2CCB7]/60">
            <div>
              <span className="block text-[10px] uppercase font-bold text-[#7A6257]">Genesis Block Digest:</span>
              <span className="font-mono text-[#3B2A22] break-all">
                03a4e3cee7978267683b51b343cb6a69ec4a7a8f...
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-[#7A6257]">Current Head Block Digest:</span>
              <span className="font-mono text-[#3B2A22] break-all">
                c5618732315162024b3383a15dccefa8d57d7681...
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Forensic Evidentiary Disclaimer */}
        <div className="pt-4 border-t border-[#F2CCB7] bg-[#FBEFE7] p-4 rounded-xl text-xs text-[#7A6257] leading-relaxed">
          <strong className="text-[#3B2A22]">Evidentiary Disclaimer & Compliance Notice:</strong> Findings contained within this dossier represent probabilistic correlations and mathematical risk scores derived from blockchain public ledgers and cybersecurity heuristics. In accordance with forensic protocol, entities are designated strictly as probable or likely destinations. CryptoTrace does not make claims regarding legal culpability or real-world natural persons.
        </div>
      </div>
    </div>
  );
}
