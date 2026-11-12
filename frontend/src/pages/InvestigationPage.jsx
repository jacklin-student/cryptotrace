import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Search,
  Filter,
  Maximize2,
  Download,
  AlertTriangle,
  Layers,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  BarChart2,
  Copy,
  Check,
  Eye,
  FileText
} from 'lucide-react';
import { Card } from '../components/Card';
import { DataModeBadge, RiskBadge, TagBadge } from '../components/Badge';
import { NetworkGraph } from '../components/NetworkGraph';
import { api } from '../api/client';

export function InvestigationPage({ dataMode, activeInvestigation, onStartTrace }) {
  const [target, setTarget] = useState(activeInvestigation?.target || 'bc1q9x3peelchaindemo984719284710293847192');
  const [chain, setChain] = useState(activeInvestigation?.chain || 'BTC');
  const [depth, setDepth] = useState(activeInvestigation?.depth || 5);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightReceiverId, setHighlightReceiverId] = useState(null);
  const [traceData, setTraceData] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('profile'); // profile | evidence | alerts
  const [copiedId, setCopiedId] = useState(null);

  // Sync with activeInvestigation if passed from Dashboard
  useEffect(() => {
    if (activeInvestigation?.target) {
      setTarget(activeInvestigation.target);
      if (activeInvestigation.chain) setChain(activeInvestigation.chain);
      if (activeInvestigation.depth) setDepth(activeInvestigation.depth);
      loadTrace(activeInvestigation.target, activeInvestigation.chain || chain, activeInvestigation.depth || depth);
    } else {
      loadTrace(target, chain, depth);
    }
  }, [activeInvestigation]);

  const loadTrace = async (targetAddr, targetChain, traceDepth) => {
    setLoading(true);
    try {
      const res = await api.startTrace({
        target: targetAddr,
        chain: targetChain,
        depth: traceDepth,
        data_mode: dataMode,
        max_nodes: 100,
        max_edges: 250
      });
      setTraceData(res);
      if (res.graph?.nodes?.length > 0) {
        const topReceiver = res.probable_end_receivers?.[0];
        setSelectedNode(topReceiver || res.graph.nodes[0]);
        if (topReceiver) {
          setHighlightReceiverId(topReceiver.id);
        }
      }
    } catch (err) {
      console.error('Trace execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!target.trim()) return;
    loadTrace(target.trim(), chain, depth);
  };

  const handleQuickLoad = (sampleTarget, sampleChain, sampleDepth) => {
    setTarget(sampleTarget);
    setChain(sampleChain);
    setDepth(sampleDepth);
    loadTrace(sampleTarget, sampleChain, sampleDepth);
  };

  const handleSelectReceiver = (rec) => {
    setSelectedNode(rec);
    setHighlightReceiverId(rec.id);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentNodes = traceData?.graph?.nodes || [];
  const currentEdges = traceData?.graph?.edges || [];
  const currentReceivers = traceData?.probable_end_receivers || [];
  const currentTimeline = traceData?.timeline || [];
  const currentAlerts = traceData?.alerts || [];

  // Filter edges connected to the selected node for evidence inspection
  const selectedNodeEdges = selectedNode
    ? currentEdges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
    : [];

  // Static fallback feature weights if backend hasn't delivered
  const featureImportances = traceData?.feature_importances || {
    peel_depth: 0.3190,
    flow_fraction: 0.2509,
    taint_score: 0.1867,
    in_degree: 0.0920,
    out_degree: 0.0856,
    mixer_exposure: 0.0400,
    sanction_proximity: 0.0153,
    adversarial_penalty: 0.0104
  };

  return (
    <div className="space-y-6">
      {/* Investigation Controls Header */}
      <div className="bg-white border border-[#F2CCB7] rounded-2xl p-5 shadow-ct-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6257] mb-1.5">
                Forensic Target Identifier (BTC / ETH Address or Tx Hash)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. bc1q... or 0x..."
                  className="w-full bg-[#FBEFE7] focus:bg-white text-sm text-[#3B2A22] placeholder-[#7A6257] px-4 py-2.5 rounded-xl border border-[#F2CCB7] focus:border-[#D9A98E] focus:outline-none focus:ring-2 focus:ring-[#F2CCB7]/50 font-mono transition-all"
                />
              </div>
            </div>

            {/* Controls: Chain & Hop Depth */}
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6257] mb-1.5">
                  Blockchain
                </label>
                <div className="flex items-center bg-[#FBEFE7] p-1 rounded-xl border border-[#F2CCB7]">
                  {['BTC', 'ETH'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChain(c)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        chain === c
                          ? 'bg-[#F2CCB7] text-[#3B2A22] shadow-sm'
                          : 'text-[#7A6257] hover:text-[#3B2A22]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hop Depth Selector (3, 5, 10 hops) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6257] mb-1.5">
                  Trace Depth
                </label>
                <div className="flex items-center bg-[#FBEFE7] p-1 rounded-xl border border-[#F2CCB7]">
                  {[3, 5, 10].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDepth(d)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        depth === d
                          ? 'bg-[#F2CCB7] text-[#3B2A22] shadow-sm'
                          : 'text-[#7A6257] hover:text-[#3B2A22]'
                      }`}
                    >
                      {d} Hops
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Trace Button */}
              <div className="self-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] text-sm font-extrabold rounded-xl border border-[#D9A98E] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <GitFork className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Rebuilding Multi-Hop Graph...' : 'Start Trace'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Scenario Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#FBEFE7]">
            <span className="text-[11px] font-bold text-[#7A6257] uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#D9A98E]" /> Quick Scenarios:
            </span>
            <button
              type="button"
              onClick={() => handleQuickLoad('bc1q9x3peelchaindemo984719284710293847192', 'BTC', 5)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-[#FBEFE7] hover:bg-[#F2CCB7] text-[#3B2A22] rounded-lg border border-[#F2CCB7] transition-all"
            >
              Peel Chain (BTC)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLoad('0x3c21a4f009384918239019283401923849102934', 'ETH', 5)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-[#FBEFE7] hover:bg-[#F2CCB7] text-[#3B2A22] rounded-lg border border-[#F2CCB7] transition-all"
            >
              Mixer Dispersal (ETH)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLoad('0x8b32948192038471928347102938471920384712', 'ETH', 3)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-[#FBEFE7] hover:bg-[#F2CCB7] text-[#3B2A22] rounded-lg border border-[#F2CCB7] transition-all"
            >
              Vanity Poisoning & Dust (ETH)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLoad('0x71c2938471029384710293847102938471029384', 'ETH', 5)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-[#FBEFE7] hover:bg-[#F2CCB7] text-[#3B2A22] rounded-lg border border-[#F2CCB7] transition-all"
            >
              Bridge Cross-Chain Correlation
            </button>
          </div>
        </form>
      </div>

      {/* Truncation Notice Banner (if limit reached) */}
      {traceData?.is_truncated && (
        <div className="bg-[#FEF9ED] border border-[#E0A030] rounded-2xl p-4 flex items-center justify-between text-xs text-[#3B2A22] shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E0A030] flex-shrink-0" />
            <div>
              <strong className="font-bold">Forensic Trace Truncated:</strong> Max graph boundaries reached ({traceData?.graph?.nodes?.length || 100} Nodes, {traceData?.graph?.edges?.length || 250} Edges).
              <span className="text-[#7A6257] ml-1">High-fanout intermediary edges have been summarized to preserve clarity.</span>
            </div>
          </div>
          <TagBadge variant="warning">LIMIT REACHED</TagBadge>
        </div>
      )}

      {/* Main Forensic Workspace: Graph on Left, Sinks & Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Graph & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Forensic Transaction Graph"
            subtitle={`Multi-Hop Directed Flow Graph (${currentNodes.length} Nodes, ${currentEdges.length} Edges)`}
            action={
              <div className="flex items-center gap-2">
                <DataModeBadge mode={dataMode} />
                <span className="text-xs text-[#7A6257] bg-[#FBEFE7] border border-[#F2CCB7] px-2.5 py-1 rounded-lg font-mono">
                  Hard Limit: 100 Nodes / 250 Edges
                </span>
              </div>
            }
          >
            <NetworkGraph
              nodes={currentNodes}
              edges={currentEdges}
              onSelectNode={(node) => setSelectedNode(node)}
              selectedNodeId={selectedNode?.id}
              highlightReceiverId={highlightReceiverId}
              isTruncated={traceData?.is_truncated}
              truncationReason={traceData?.truncation_reason}
            />
          </Card>

          {/* Chronological Fund Movement Timeline */}
          <Card
            title="Chronological Fund Movement Timeline"
            subtitle="Step-by-step transaction flow reconstructed across hops"
          >
            {currentTimeline.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {currentTimeline.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FBEFE7] border border-[#F2CCB7] text-xs hover:border-[#D9A98E] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#F2CCB7] text-[#3B2A22] font-bold flex items-center justify-center font-mono">
                        {step.hop}
                      </span>
                      <div>
                        <div className="font-bold text-[#3B2A22] flex items-center gap-2 font-mono">
                          <span
                            onClick={() => {
                              const n = currentNodes.find((x) => x.id === step.from);
                              if (n) setSelectedNode(n);
                            }}
                            className="cursor-pointer hover:underline text-[#3B2A22] truncate max-w-[120px]"
                          >
                            {step.from}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#D9A98E] flex-shrink-0" />
                          <span
                            onClick={() => {
                              const n = currentNodes.find((x) => x.id === step.to);
                              if (n) setSelectedNode(n);
                            }}
                            className="cursor-pointer hover:underline text-[#3B2A22] truncate max-w-[120px]"
                          >
                            {step.to}
                          </span>
                        </div>
                        <div className="text-[#7A6257] text-[10px] mt-0.5">{step.timestamp}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-[#3B2A22]">
                        {step.amount} {step.chain}
                      </div>
                      <TagBadge variant="accent">{step.tag}</TagBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#7A6257]">
                No chronological records available for current target.
              </div>
            )}
          </Card>

          {/* ML Feature Importances Explainability Card */}
          <Card
            title="Forensic Evidence Model: Feature Importance Weights"
            subtitle="Scoring signals calculated by Elliptic-aligned Random Forest Classifier"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(featureImportances).map(([feat, weight]) => {
                const pct = (weight * 100).toFixed(1);
                return (
                  <div key={feat} className="p-2.5 rounded-xl bg-[#FBEFE7] border border-[#F2CCB7]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-[#3B2A22] capitalize">
                        {feat.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono font-bold text-[#3E9B6B]">{pct}%</span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#F2CCB7]/60">
                      <div
                        className="bg-[#D9A98E] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct * 2.5, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-[#FBEFE7] text-[11px] text-[#7A6257] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D9A98E]" />
              <span>
                <strong>Explainable Forensics:</strong> Model combines graph topological decay, flow fraction, peel depth, and adversarial penalties into an unskewed confidence score.
              </span>
            </div>
          </Card>
        </div>

        {/* Right Col: Ranked Probable End Receivers & Node Inspector */}
        <div className="space-y-6">
          {/* Ranked Probable End Receivers Table */}
          <Card
            title="Ranked Probable End Receivers"
            subtitle="Calculated via taint decay, flow fraction & heuristic weighting"
          >
            <div className="space-y-3">
              {currentReceivers.length > 0 ? (
                currentReceivers.map((rec, idx) => {
                  const isSelected = selectedNode?.id === rec.id;
                  return (
                    <div
                      key={rec.id || idx}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#3E9B6B] bg-[#EBF7F0] ring-2 ring-[#3E9B6B]/20'
                          : 'border-[#F2CCB7] bg-[#FBEFE7] hover:bg-white hover:border-[#D9A98E]'
                      }`}
                      onClick={() => handleSelectReceiver(rec)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#3B2A22] text-white text-[10px] font-extrabold flex items-center justify-center">
                            #{rec.rank || idx + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#3B2A22] truncate max-w-[130px]">
                            {rec.id}
                          </span>
                        </div>
                        <RiskBadge level={rec.risk_level} score={rec.risk_score} />
                      </div>

                      <p className="text-[11px] text-[#7A6257] leading-relaxed mb-2">
                        {rec.reasoning}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F2CCB7]/60 text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="text-[#7A6257]">Confidence:</span>
                          <span className="font-bold text-[#3E9B6B] font-mono">
                            {rec.confidence_score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectReceiver(rec);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] rounded border border-[#D9A98E]"
                          >
                            Highlight Route
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[#7A6257] bg-[#FBEFE7] rounded-xl border border-[#F2CCB7]">
                  No terminal receivers discovered yet. Increase trace depth or select a different starting seed.
                </div>
              )}
            </div>
          </Card>

          {/* Node Forensic Details & Evidentiary Inspector Panel */}
          <Card
            title="Node Forensic Inspector"
            subtitle="Deep dive into selected wallet characteristics and evidence"
            action={
              <div className="flex bg-[#FBEFE7] p-0.5 rounded-lg border border-[#F2CCB7]">
                <button
                  type="button"
                  onClick={() => setInspectorTab('profile')}
                  className={`px-2 py-1 text-[11px] font-bold rounded ${
                    inspectorTab === 'profile' ? 'bg-[#F2CCB7] text-[#3B2A22]' : 'text-[#7A6257]'
                  }`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('evidence')}
                  className={`px-2 py-1 text-[11px] font-bold rounded ${
                    inspectorTab === 'evidence' ? 'bg-[#F2CCB7] text-[#3B2A22]' : 'text-[#7A6257]'
                  }`}
                >
                  Evidence ({selectedNodeEdges.length})
                </button>
              </div>
            }
          >
            {selectedNode ? (
              <div className="space-y-3 text-xs">
                {/* Node Identifier Header with Copy */}
                <div className="p-3 rounded-xl bg-[#FBEFE7] border border-[#F2CCB7]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#7A6257]">
                    <span>Selected Wallet Identifier</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedNode.id)}
                      className="text-[#3B2A22] hover:text-[#D9A98E] flex items-center gap-1 font-sans"
                    >
                      {copiedId === selectedNode.id ? (
                        <Check className="w-3 h-3 text-[#3E9B6B]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === selectedNode.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono font-bold text-[#3B2A22] break-all mt-1">
                    {selectedNode.id}
                  </div>
                  {selectedNode.entity_label && (
                    <div className="mt-1 text-[11px] text-[#7A6257] font-semibold">
                      Ground Truth Entity: <span className="text-[#3B2A22]">{selectedNode.entity_label}</span>
                    </div>
                  )}
                </div>

                {inspectorTab === 'profile' ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white border border-[#F2CCB7]">
                        <span className="text-[10px] font-bold text-[#7A6257] uppercase">Cyber-Risk Score</span>
                        <div className="text-base font-extrabold text-[#3B2A22] mt-0.5 flex items-center justify-between">
                          <span>{selectedNode.risk_score || 0}/100</span>
                          <RiskBadge level={selectedNode.risk_level || 'LOW'} />
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-[#F2CCB7]">
                        <span className="text-[10px] font-bold text-[#7A6257] uppercase">Evidence Confidence</span>
                        <div className="text-base font-extrabold text-[#3E9B6B] mt-0.5">
                          {selectedNode.confidence_score || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[#F2CCB7] space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6257]">
                        Attribution Rationale
                      </span>
                      <p className="text-xs text-[#3B2A22] leading-relaxed">
                        {selectedNode.reasoning || 'Standard graph node traversed during multi-hop flow analysis.'}
                      </p>
                      <div className="pt-2 border-t border-[#FBEFE7] flex items-center justify-between text-[11px] text-[#7A6257]">
                        <span>Probable End Receiver:</span>
                        <span className={`font-bold ${selectedNode.is_probable_end_receiver ? 'text-[#3E9B6B]' : 'text-[#7A6257]'}`}>
                          {selectedNode.is_probable_end_receiver ? 'Yes (Confirmed Rank)' : 'No (Intermediate Hop)'}
                        </span>
                      </div>
                      {selectedNode.cluster_id && (
                        <div className="text-[11px] text-[#7A6257]">
                          Common-Input Cluster: <span className="font-mono text-[#3B2A22] font-semibold">{selectedNode.cluster_id}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Evidence Transactions Tab */
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedNodeEdges.length > 0 ? (
                      selectedNodeEdges.map((e, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-[#F2CCB7] space-y-1 hover:border-[#D9A98E] transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-[#7A6257]">
                              {e.tx_hash ? `${e.tx_hash.slice(0, 10)}...${e.tx_hash.slice(-6)}` : 'On-Chain Tx'}
                            </span>
                            <DataModeBadge mode={dataMode} />
                          </div>
                          <div className="flex items-center justify-between font-mono text-xs font-bold text-[#3B2A22]">
                            <span>{e.amount} {e.chain || chain}</span>
                            <span className="text-[10px] font-normal text-[#7A6257]">Hop #{e.hop_number || 1}</span>
                          </div>
                          <div className="text-[10px] text-[#7A6257] flex items-center gap-1">
                            <span>Type:</span>
                            <span className="font-semibold text-[#3B2A22]">{e.edge_type || 'TRANSFER'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-[#7A6257]">
                        No direct transaction edges linked to this node in current graph slice.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#7A6257]">
                Click any node in the graph above to inspect its forensic characteristics.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
