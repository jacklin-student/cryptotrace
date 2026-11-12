import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  GitFork,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Coins,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, StatCard } from '../components/Card';
import { DataModeBadge, RiskBadge, TagBadge } from '../components/Badge';
import { api } from '../api/client';

export function DashboardPage({ onSelectTarget, dataMode, onLaunchDemo }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);
  const [demoCases, setDemoCases] = useState([]);
  const [loadingDemoId, setLoadingDemoId] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [dashRes, db, demos] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getDbStatus(),
          api.getDemoCases()
        ]);
        if (dashRes.status === 'fulfilled') {
          setStats(dashRes.value);
        }
        if (db.status === 'fulfilled') {
          setDbStatus(db.value);
        }
        if (demos.status === 'fulfilled' && Array.isArray(demos.value)) {
          setDemoCases(demos.value);
        }
      } catch (err) {
        console.error('Failed to load dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDemoClick = async (demo) => {
    setLoadingDemoId(demo.id);
    try {
      await api.loadDemoCase(demo.id);
      onLaunchDemo({
        id: demo.id,
        target: demo.target_address || demo.target,
        chain: demo.target_chain || demo.chain || 'BTC',
        depth: demo.depth || 5,
        title: demo.title
      });
    } catch (err) {
      console.error('Failed to load demo scenario:', err);
      onLaunchDemo({
        id: demo.id,
        target: demo.target_address || demo.target,
        chain: demo.target_chain || demo.chain || 'BTC',
        depth: demo.depth || 5,
        title: demo.title
      });
    } finally {
      setLoadingDemoId(null);
    }
  };

  const handleReopenInvestigation = (inv) => {
    onLaunchDemo({
      id: inv.id,
      target: inv.target_address,
      chain: inv.target_chain || 'BTC',
      depth: inv.depth || 5,
      title: inv.title
    });
  };

  // Fallback demo cases if backend endpoint hasn't responded yet
  const displayDemoCases = demoCases.length > 0 ? demoCases : [
    {
      id: 'demo-peel-chain',
      title: 'Peel Chain Extraction (BTC)',
      target_address: 'bc1q9x3peelchaindemo984719284710293847192',
      target_chain: 'BTC',
      depth: 5,
      description: 'Multi-hop peel pattern with repeated large change outputs and small splits to unhosted wallets.',
      risk: 'HIGH',
      badge: 'PEEL CHAIN'
    },
    {
      id: 'demo-mixer',
      title: 'Mixer Fan-In / Fan-Out (ETH)',
      target_address: '0x3c21a4f009384918239019283401923849102934',
      target_chain: 'ETH',
      depth: 5,
      description: 'Coordinated equal-deposit fan-in followed by randomized dispersal across multiple hops.',
      risk: 'HIGH',
      badge: 'MIXER FAN-OUT'
    },
    {
      id: 'demo-poisoning',
      title: 'Address Poisoning & Dusting (ETH)',
      target_address: '0x8b32948192038471928347102938471920384712',
      target_chain: 'ETH',
      depth: 3,
      description: 'Zero-value look-alike vanity address transfer designed to hijack clipboard transactions.',
      risk: 'MEDIUM',
      badge: 'POISONING / DUST'
    },
    {
      id: 'demo-bridge',
      title: 'Cross-Chain Bridge Correlation',
      target_address: '0x71c2938471029384710293847102938471029384',
      target_chain: 'ETH',
      depth: 5,
      description: 'Temporal and value-matching between Ethereum burn event and Polygon mint transaction.',
      risk: 'MEDIUM',
      badge: 'EXPERIMENTAL BRIDGE'
    }
  ];

  // Default Chart Data Fallbacks
  const riskDistributionData = stats?.risk_distribution || [
    { name: 'High Risk', value: 64, percentage: 7.2, color: '#C0392B' },
    { name: 'Medium Risk', value: 182, percentage: 20.4, color: '#E0A030' },
    { name: 'Low Risk', value: 646, percentage: 72.4, color: '#3E9B6B' }
  ];

  const activityData = stats?.transaction_activity || [
    { timestamp: '02:00', transactions: 142, volume: 12.4, adversarial: 8 },
    { timestamp: '06:00', transactions: 218, volume: 28.1, adversarial: 14 },
    { timestamp: '10:00', transactions: 485, volume: 64.8, adversarial: 32 },
    { timestamp: '14:00', transactions: 620, volume: 91.2, adversarial: 41 },
    { timestamp: '18:00', transactions: 395, volume: 48.6, adversarial: 23 },
    { timestamp: '22:00', transactions: 268, volume: 21.3, adversarial: 15 }
  ];

  const relationshipData = stats?.wallet_relationships || [
    { category: 'Seed Sources', count: 18, color: '#3B2A22' },
    { category: 'Intermediary Peels', count: 485, color: '#D9A98E' },
    { category: 'Probable End Receivers', count: 19, color: '#3E9B6B' },
    { category: 'Mixer Pools & Bridges', count: 52, color: '#C0392B' },
    { category: 'Adversarial Decoys / Dust', count: 86, color: '#E0A030' },
    { category: 'Exchanges / Counterparties', count: 232, color: '#7A6257' }
  ];

  const recentInvestigations = stats?.recent_investigations || [];

  return (
    <div className="space-y-6">
      {/* Welcome & System Banner */}
      <div className="bg-gradient-to-r from-[#FBEFE7] via-white to-[#FBEFE7] border border-[#F2CCB7] rounded-2xl p-6 shadow-ct-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A6257]">
                Blockchain Forensics Console
              </span>
              <DataModeBadge mode={dataMode} />
            </div>
            <h2 className="text-2xl font-extrabold text-[#3B2A22]">
              Forensic Intelligence & End-Receiver Discovery
            </h2>
            <p className="text-sm text-[#7A6257] mt-1 max-w-3xl leading-relaxed">
              Trace illicit fund flows across multi-hop graphs, unravel obfuscation layers (mixers, peel chains, cross-chain bridges), and evaluate probabilistic end receivers with explainable cybersecurity heuristics.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => handleDemoClick(displayDemoCases[0])}
              disabled={loadingDemoId !== null}
              className="px-4 py-2 bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] text-sm font-bold rounded-xl border border-[#D9A98E] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              <span>{loadingDemoId ? 'Loading Scenario...' : 'Launch Demo Case'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row: 7 Cards from Module 1 Requirements */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label="Tx Analysed"
          value={stats?.cards?.total_transactions_analysed?.toLocaleString() || '1,428'}
          icon={Activity}
          subtitle="Multi-hop records"
        />
        <StatCard
          label="Wallets"
          value={stats?.cards?.wallets_discovered?.toLocaleString() || '892'}
          icon={Coins}
          subtitle="Unique nodes"
        />
        <StatCard
          label="Suspicious"
          value={stats?.cards?.suspicious_wallets?.toLocaleString() || '147'}
          icon={AlertTriangle}
          subtitle="Risk score >= 40"
        />
        <StatCard
          label="High Risk"
          value={stats?.cards?.high_risk_transactions?.toLocaleString() || '38'}
          icon={ShieldAlert}
          subtitle="Severity High"
        />
        <StatCard
          label="End Receivers"
          value={stats?.cards?.probable_end_receivers?.toLocaleString() || '19'}
          icon={GitFork}
          subtitle="Ranked sinks"
        />
        <StatCard
          label="Mixer Patterns"
          value={stats?.cards?.mixer_patterns?.toLocaleString() || '12'}
          icon={Layers}
          subtitle="Fan-in / fan-out"
        />
        <StatCard
          label="Cross-Chain"
          value={stats?.cards?.cross_chain_activities?.toLocaleString() || '7'}
          icon={ArrowUpRight}
          subtitle="Bridge flows"
        />
      </div>

      {/* Interactive Charts: Module 1 Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Risk Distribution Donut */}
        <Card
          title="Entity Risk Distribution"
          subtitle="Evaluated wallets across threat categories"
        >
          <div className="h-64 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-xl border border-[#F2CCB7] shadow-ct-sm text-xs">
                          <span className="font-bold" style={{ color: d.color }}>{d.name}: </span>
                          <span className="font-mono font-bold text-[#3B2A22]">{d.value}</span>
                          <span className="text-[#7A6257] ml-1">({d.percentage}%)</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold pt-2 border-t border-[#FBEFE7]">
              {riskDistributionData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#3B2A22]">{item.name}</span>
                  <span className="text-[#7A6257] text-[11px] font-mono">({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Chart 2: Transaction Activity Over Time */}
        <Card
          title="Forensic Activity Over Time"
          subtitle="Chronological multi-hop volume and adversarial spikes"
        >
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2CCB7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FBEFE7" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBEFE7" />
                <XAxis dataKey="timestamp" stroke="#7A6257" fontSize={11} tickLine={false} />
                <YAxis stroke="#7A6257" fontSize={11} tickLine={false} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-xl border border-[#F2CCB7] shadow-ct-sm text-xs">
                          <div className="font-bold text-[#3B2A22] mb-1">{d.timestamp} Window</div>
                          <div className="text-[#3B2A22]">Transactions: <span className="font-mono font-bold">{d.transactions}</span></div>
                          <div className="text-[#C0392B]">Adversarial Spikes: <span className="font-mono font-bold">{d.adversarial}</span></div>
                          <div className="text-[#7A6257]">Volume: <span className="font-mono font-bold">{d.volume} ETH/BTC</span></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#D9A98E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTx)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Wallet Relationship Overview */}
        <Card
          title="Discovered Wallet Breakdown"
          subtitle="Structural distribution of traversed network roles"
        >
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={relationshipData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#FBEFE7" />
                <XAxis type="number" stroke="#7A6257" fontSize={10} tickLine={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#3B2A22"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-xl border border-[#F2CCB7] shadow-ct-sm text-xs">
                          <span className="font-bold text-[#3B2A22]">{d.category}: </span>
                          <span className="font-mono font-bold" style={{ color: d.color }}>{d.count} nodes</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {relationshipData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Investigations Table (Click to Reopen) */}
      <Card
        title="Recent Forensic Investigations"
        subtitle="Historical multi-hop cases recorded in the forensics ledger (click to reopen full graph)"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F2CCB7] text-[#7A6257] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Investigation Title</th>
                <th className="py-2.5 px-3">Target Vector</th>
                <th className="py-2.5 px-3">Chain / Depth</th>
                <th className="py-2.5 px-3">Discovered Nodes</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FBEFE7]">
              {recentInvestigations.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-[#FBEFE7]/50 transition-colors cursor-pointer group"
                  onClick={() => handleReopenInvestigation(inv)}
                >
                  <td className="py-3 px-3 font-mono font-bold text-[#3B2A22]">
                    {inv.id}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#3B2A22] max-w-[220px] truncate">
                    {inv.title}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#7A6257]">
                    <span className="bg-[#FBEFE7] px-2 py-0.5 rounded border border-[#F2CCB7]">
                      {inv.target_address ? `${inv.target_address.slice(0, 8)}...${inv.target_address.slice(-6)}` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#3B2A22]">{inv.target_chain}</span>
                    <span className="text-[#7A6257] ml-1">({inv.depth} Hops)</span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="text-[#3B2A22] font-bold">
                      {inv.summary?.nodes_discovered || 15} Nodes
                    </span>
                    <span className="text-[#3E9B6B] font-semibold ml-1.5">
                      ({inv.summary?.probable_receivers || 1} Receivers)
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {inv.status || 'COMPLETED'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReopenInvestigation(inv);
                      }}
                      className="px-3 py-1 bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] text-[11px] font-bold rounded-lg border border-[#D9A98E] transition-all inline-flex items-center gap-1 shadow-sm"
                    >
                      <span>Reopen</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Demo Investigation Scenarios (Bundled Offline Cases) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[#3B2A22]">
              Bundled Forensics Scenarios
            </h3>
            <p className="text-xs text-[#7A6257]">
              Pre-computed multi-hop cases verifying peel chains, mixer dispersal, vanity address poisoning, and cross-chain bridges (100% offline)
            </p>
          </div>
          <span className="text-xs text-[#7A6257] font-semibold bg-[#FBEFE7] px-2.5 py-1 rounded-lg border border-[#F2CCB7]">
            {displayDemoCases.length} Scenarios Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayDemoCases.map((demo) => (
            <div
              key={demo.id}
              className="bg-white border border-[#F2CCB7] hover:border-[#D9A98E] rounded-2xl p-5 shadow-ct-sm hover:shadow-ct-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#FBEFE7] text-[#3B2A22] border border-[#F2CCB7]">
                    {demo.target_chain} • {demo.depth} Hops
                  </span>
                  <RiskBadge level={demo.risk || 'HIGH'} />
                </div>
                <h4 className="text-base font-bold text-[#3B2A22] mb-1">
                  {demo.title}
                </h4>
                <p className="text-xs text-[#7A6257] mb-3 leading-relaxed">
                  {demo.description}
                </p>
                <div className="bg-[#FBEFE7] p-2.5 rounded-xl mb-3 border border-[#F2CCB7]/60">
                  <div className="text-[10px] font-semibold uppercase text-[#7A6257]">Seed Target Vector</div>
                  <div className="font-mono text-xs text-[#3B2A22] truncate mt-0.5">
                    {demo.target_address}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#FBEFE7]">
                <TagBadge variant="accent">{demo.badge || demo.target_chain}</TagBadge>
                <button
                  onClick={() => handleDemoClick(demo)}
                  disabled={loadingDemoId === demo.id}
                  className="px-3.5 py-1.5 bg-[#F2CCB7] hover:bg-[#D9A98E] text-[#3B2A22] text-xs font-bold rounded-xl border border-[#D9A98E] transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  <span>{loadingDemoId === demo.id ? 'Loading...' : 'Investigate Graph'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database & Forensics Engine Telemetry */}
      <Card title="Database & Heuristics Pipeline Status" subtitle="SQLite Forensics Database with 9 Operational Tables">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
          {[
            { name: 'investigations', label: 'Investigations' },
            { name: 'wallets', label: 'Wallets' },
            { name: 'transactions', label: 'Transactions' },
            { name: 'edges', label: 'Graph Edges' },
            { name: 'clusters', label: 'BTC Clusters' },
            { name: 'labels', label: 'Entity Labels' },
            { name: 'alerts', label: 'Threat Alerts' },
            { name: 'audit_log', label: 'Audit Chain' },
            { name: 'api_cache', label: 'API Cache' },
          ].map((t) => {
            const count = dbStatus?.tables ? dbStatus.tables[t.name] || 0 : 0;
            return (
              <div
                key={t.name}
                className="bg-[#FBEFE7] p-3 rounded-xl border border-[#F2CCB7] flex flex-col justify-between"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6257] truncate">
                  {t.label}
                </span>
                <div className="text-lg font-extrabold text-[#3B2A22] mt-1">
                  {count}
                </div>
                <span className="text-[10px] text-[#3E9B6B] font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Forensic Language Rule & Compliance Callout */}
      <div className="bg-[#FBEFE7] border border-[#F2CCB7] rounded-2xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-[#D9A98E] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#7A6257] leading-relaxed">
          <strong className="text-[#3B2A22] font-bold">Probabilistic Forensics Standard:</strong> All investigative findings are generated as probabilistic risk scores and cluster linkages based on mathematical heuristics and graph topology. CryptoTrace reports probable and likely destinations with explicit confidence bounds and does not claim legal guilt or identify real-world individuals.
        </div>
      </div>
    </div>
  );
}
