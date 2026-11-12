import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data/peer';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export function NetworkGraph({
  nodes = [],
  edges = [],
  onSelectNode,
  selectedNodeId,
  highlightReceiverId,
  isTruncated = false,
  truncationReason = null
}) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  // Helper to determine node color styling
  const getNodeColor = (node) => {
    if (node.heuristic_tags?.includes('SOURCE_TARGET') || node.heuristic_tags?.includes('SEED_SOURCE')) {
      return {
        background: '#3B2A22',
        border: '#1E140F',
        highlight: { background: '#251A14', border: '#000000' }
      };
    }
    if (node.is_probable_end_receiver) {
      return {
        background: '#3E9B6B',
        border: '#276E4B',
        highlight: { background: '#2E8557', border: '#1C5237' }
      };
    }
    if (node.threat_tags?.includes('DUST_DECOY') || node.threat_tags?.includes('ADDRESS_POISONING')) {
      return {
        background: '#FDF2F1',
        border: '#C0392B',
        highlight: { background: '#F8D2CF', border: '#962D22' }
      };
    }
    if (node.risk_level === 'HIGH' || node.risk_score >= 70) {
      return {
        background: '#FDF2F1',
        border: '#C0392B',
        highlight: { background: '#F8D2CF', border: '#962D22' }
      };
    }
    if (node.risk_level === 'MEDIUM' || node.risk_score >= 40) {
      return {
        background: '#FEF9ED',
        border: '#E0A030',
        highlight: { background: '#FCE8BD', border: '#B57E1E' }
      };
    }
    return {
      background: '#FFFFFF',
      border: '#D9A98E',
      highlight: { background: '#FBEFE7', border: '#C49277' }
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter nodes if needed
    const filteredNodes = nodes.filter((n) => {
      if (filterRisk === 'ALL') return true;
      if (filterRisk === 'HIGH') return n.risk_level === 'HIGH' || n.risk_score >= 70;
      if (filterRisk === 'MEDIUM') return n.risk_level === 'MEDIUM' || (n.risk_score >= 40 && n.risk_score < 70);
      if (filterRisk === 'RECEIVERS') return n.is_probable_end_receiver;
      return true;
    });

    const activeNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Vis-network DataSets
    const visNodes = new DataSet(
      filteredNodes.map((n) => {
        const colors = getNodeColor(n);
        const isSelected = selectedNodeId === n.id;
        const isReceiver = n.is_probable_end_receiver;
        const isHighlight = highlightReceiverId === n.id;

        return {
          id: n.id,
          label: n.label || `${n.id.slice(0, 6)}...${n.id.slice(-4)}`,
          title: `Address: ${n.id}\nRisk: ${n.risk_level} (${n.risk_score})\nConfidence: ${n.confidence_score}%\n${n.reasoning || ''}`,
          color: colors,
          shape: isReceiver ? 'diamond' : 'dot',
          size: isReceiver ? 24 : isSelected || isHighlight ? 22 : 16,
          font: {
            color: n.heuristic_tags?.includes('SOURCE_TARGET') || n.heuristic_tags?.includes('SEED_SOURCE') ? '#FFFFFF' : '#3B2A22',
            size: 11,
            face: 'Plus Jakarta Sans',
            strokeWidth: 3,
            strokeColor: '#FFFFFF'
          },
          borderWidth: isSelected || isHighlight ? 4 : 2,
          shadow: {
            enabled: true,
            color: 'rgba(59, 42, 34, 0.15)',
            size: 6,
            x: 1,
            y: 2
          }
        };
      })
    );

    const visEdges = new DataSet(
      edges
        .filter((e) => activeNodeIds.has(e.from) && activeNodeIds.has(e.to))
        .map((e) => {
          const isAdversarial = e.is_adversarial;
          const isPeel = e.edge_type === 'PEEL_FORWARD';

          return {
            id: e.id || `e_${e.from}_${e.to}`,
            from: e.from,
            to: e.to,
            label: e.amount ? `${e.amount} ${e.chain || ''}` : '',
            arrows: { to: { enabled: true, scaleFactor: 0.75 } },
            color: {
              color: isAdversarial ? '#C0392B' : isPeel ? '#E0A030' : '#D9A98E',
              highlight: '#3B2A22',
              hover: '#3B2A22'
            },
            dashes: isAdversarial,
            width: isAdversarial ? 1.5 : 2,
            font: {
              size: 9,
              face: 'JetBrains Mono',
              color: isAdversarial ? '#C0392B' : '#7A6257',
              strokeWidth: 2,
              strokeColor: '#FFFFFF',
              align: 'top'
            },
            smooth: { type: 'cubicBezier', roundness: 0.2 }
          };
        })
    );

    const options = {
      nodes: {
        scaling: { min: 14, max: 28 },
      },
      edges: {
        hoverWidth: 1.5,
      },
      physics: {
        enabled: physicsEnabled,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -38,
          centralGravity: 0.008,
          springLength: 120,
          springConstant: 0.08,
          damping: 0.45,
          avoidOverlap: 0.8
        },
        stabilization: { iterations: 120 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        zoomView: true,
        dragView: true,
        navigationButtons: false
      }
    };

    const network = new Network(containerRef.current, { nodes: visNodes, edges: visEdges }, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const nodeObj = nodes.find((n) => n.id === clickedId);
        if (onSelectNode) onSelectNode(nodeObj || { id: clickedId });
      }
    });

    return () => {
      network.destroy();
    };
  }, [nodes, edges, filterRisk, physicsEnabled, selectedNodeId, highlightReceiverId]);

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.25 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.8 });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    }
  };

  return (
    <div className="relative w-full h-[500px] bg-[#FBEFE7]/40 rounded-2xl border border-[#F2CCB7] overflow-hidden shadow-inner">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Filter Buttons */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-[#F2CCB7] shadow-sm pointer-events-auto">
          {[
            { id: 'ALL', label: 'All Nodes' },
            { id: 'HIGH', label: 'High Risk' },
            { id: 'RECEIVERS', label: 'End Receivers' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterRisk(f.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                filterRisk === f.id
                  ? 'bg-[#F2CCB7] text-[#3B2A22] shadow-sm'
                  : 'text-[#7A6257] hover:text-[#3B2A22]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right Navigation & Physics Tools */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-[#F2CCB7] shadow-sm pointer-events-auto">
          <button
            onClick={() => setPhysicsEnabled(!physicsEnabled)}
            title={physicsEnabled ? 'Freeze Physics' : 'Enable Physics'}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              physicsEnabled ? 'bg-[#FBEFE7] text-[#3B2A22]' : 'text-[#7A6257] hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-[#7A6257] hover:text-[#3B2A22] hover:bg-[#FBEFE7] rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-[#7A6257] hover:text-[#3B2A22] hover:bg-[#FBEFE7] rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            title="Fit to Screen"
            className="p-1.5 text-[#7A6257] hover:text-[#3B2A22] hover:bg-[#FBEFE7] rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Truncation Notice Warning Banner */}
      {isTruncated && (
        <div className="absolute bottom-12 left-3 right-3 z-10 bg-[#FEF9ED] border border-[#FCE8BD] p-2.5 rounded-xl flex items-center justify-between text-xs text-[#92400E] shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E0A030] flex-shrink-0" />
            <span className="font-bold">
              Trace Truncated: {truncationReason || 'Hard limits of max nodes/edges reached to preserve performance.'}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded border border-[#FCE8BD]">
            Partial Subgraph
          </span>
        </div>
      )}

      {/* Graph Visual Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom Minimal Legend */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-3 bg-white/85 backdrop-blur-sm px-3 py-1 rounded-lg border border-[#F2CCB7] text-[11px] text-[#7A6257]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B2A22]" />
          <span>Source</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C0392B]" />
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E0A030]" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-[#3E9B6B]" />
          <span className="font-bold text-[#3E9B6B]">End Receiver</span>
        </div>
      </div>
    </div>
  );
}
