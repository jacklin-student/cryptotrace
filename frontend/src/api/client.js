/**
 * CryptoTrace API Client
 * Robust client with validation, caching, and fallback support
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === 'string' 
            ? errorJson.detail 
            : JSON.stringify(errorJson.detail);
        }
      } catch (_) {}
      throw new Error(errorDetail);
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // System & Health
  getHealth: () => fetchJson('/api/health'),
  getDbStatus: () => fetchJson('/api/db/status'),
  getTheme: () => fetchJson('/api/theme'),

  // Phase 2: Ingestion & Validation
  validateIdentifier: (query) => fetchJson('/api/ingest/validate', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }),
  fetchTransactions: (payload) => fetchJson('/api/ingest/fetch', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Phase 2: Ground Truth Entity Labels
  getLabels: (chain = null, category = null) => {
    const params = new URLSearchParams();
    if (chain) params.append('chain', chain);
    if (category) params.append('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/api/labels${qs}`);
  },
  getLabelByAddress: (address) => fetchJson(`/api/labels/${encodeURIComponent(address)}`),

  // Phase 2: Demo Cases (Offline Capabilities)
  getDemoCases: () => fetchJson('/api/demo/cases'),
  getDemoCase: (caseId) => fetchJson(`/api/demo/case/${encodeURIComponent(caseId)}`),
  loadDemoCase: (caseId) => fetchJson(`/api/demo/load/${encodeURIComponent(caseId)}`, {
    method: 'POST',
  }),

  // Dashboard Stats
  getDashboardStats: () => fetchJson('/api/dashboard/stats'),
  getInvestigations: () => fetchJson('/api/investigations'),

  // Tracing
  startTrace: (payload) => fetchJson('/api/trace', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getTrace: (id) => fetchJson(`/api/trace/${id}`),

  // Wallets
  getWallet: (address) => fetchJson(`/api/wallet/${address}`),

  // Audit Log & Security
  getAuditLog: (investigationId) => fetchJson(`/api/audit/${investigationId}`),
  verifyAuditLog: (payload) => fetchJson('/api/audit/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  simulateTamper: (payload) => fetchJson('/api/demo/tamper', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Reports
  generateReport: (investigationId) => fetchJson(`/api/report/${investigationId}`, {
    method: 'POST',
  }),
  getPdfReportUrl: (investigationId) => `${BASE_URL}/api/report/pdf/${encodeURIComponent(investigationId)}`,
  getHtmlGraphUrl: (investigationId) => `${BASE_URL}/api/report/html/${encodeURIComponent(investigationId)}`,
  getJsonTraceUrl: (investigationId) => `${BASE_URL}/api/report/json/${encodeURIComponent(investigationId)}`,
  getJsonTrace: (investigationId) => fetchJson(`/api/report/json/${encodeURIComponent(investigationId)}`),
};
