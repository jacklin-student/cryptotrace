# CryptoTrace
### A Cybersecurity-Driven Blockchain Forensics Engine for Tracing and Identifying Probable End Receivers of Illicit Crypto Transactions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com)
[![NetworkX](https://img.shields.io/badge/Graph-NetworkX-blue.svg)](https://networkx.org)
[![Scikit-Learn](https://img.shields.io/badge/ML-Random%20Forest-F7931E.svg)](https://scikit-learn.org)

---

## 1. Executive Overview

Criminal actors frequently obfuscate stolen cryptocurrency through intricate laundering methodologies: **peel chains**, **mixer pools (Tornado Cash, Sinbad)**, **cross-chain bridges (Polygon PoS)**, **address poisoning**, and **dust decoys**. Traditional blockchain explorers display raw transaction entries but lack end-to-end topological reconstruction, multi-hop taint tracking, adversarial anomaly detection, and explainable end-receiver attribution.

**CryptoTrace** solves this gap by providing an end-to-end cybersecurity forensics platform that:
1. Rebuilds multi-hop directed graphs from seed transaction vectors.
2. Unravels multi-stage obfuscation layers using blockchain heuristics.
3. Detects adversarial manipulation (vanity address poisoning, micro-dust injection, circular decoy loops).
4. Scores terminal sinks using decaying taint propagation and an Elliptic-aligned Random Forest classifier.
5. Ranks **probable end-receivers** with plain-English, evidence-backed rationales.
6. Records an immutable, tamper-evident SHA-256 Merkle-linked audit trail.

---

## 2. Strict UI Theme & Palette Specification

CryptoTrace features a clean, professional, daylight forensics UI adhering to strict color rules (no dark mode):

| UI Component | Hex Code | Visual Swatch & Role |
| :--- | :--- | :--- |
| **Canvas Background** | `#FFFFFF` | Crisp white primary page surface |
| **Primary Skin** | `#F2CCB7` | Cards, buttons, highlights, badges |
| **Darker Skin Accent** | `#D9A98E` | Active borders, hover states, dividers |
| **Soft Skin Tint** | `#FBEFE7` | Section backgrounds, timeline cards, inputs |
| **Deep Brown Text** | `#3B2A22` | Primary headings, titles, high-contrast text |
| **Muted Brown Text** | `#7A6257` | Subtitles, labels, descriptions, secondary text |
| **High Cyber-Risk** | `#C0392B` | Muted red for sanctioned entities, terminal laundered sinks |
| **Medium Cyber-Risk**| `#E0A030` | Amber for peel chains, unhosted transit hops, decoys |
| **Low Cyber-Risk** | `#3E9B6B` | Green for verified exchanges, low-taint counterparties |

---

## 3. Core Architecture & Modules

```
CryptoTrace/
├── backend/
│   ├── main.py                     # FastAPI REST API, lifecycle & routes
│   ├── config.py                   # System settings & theme definitions
│   ├── database.py                 # SQLite database engine & session factory
│   ├── models/                     # SQLAlchemy Models (9 core tables)
│   │   ├── investigation.py        # Case records & graph metadata
│   │   ├── wallet.py               # Node forensic profiles & scores
│   │   ├── edge.py                 # Graph directed transfers
│   │   ├── transaction.py          # On-chain / demo transaction records
│   │   ├── cluster.py              # Common-input BTC ownership clusters
│   │   ├── label.py                # Ground-truth entity registry (OFAC, exchanges)
│   │   ├── alert.py                # Cybersecurity adversarial threat logs
│   │   ├── audit_log.py            # SHA-256 Merkle-linked audit blocks
│   │   └── api_cache.py            # API response caching with checksums
│   ├── services/
│   │   ├── detector.py             # BTC/ETH address & tx hash multi-format validator
│   │   ├── ingestion.py            # Multi-provider blockchain pipeline (UTXO & account)
│   │   ├── demo_service.py         # 4 offline forensic scenarios
│   │   ├── graph_engine.py         # NetworkX multi-hop DiGraph builder & boundary limiter
│   │   ├── heuristic_engine.py     # 5 Obfuscation modules (Peel, Mixer, Bridge, Clusters, Labels)
│   │   ├── security.py             # Cybersecurity threats (Poisoning, Dust, Cycles, API Tamper)
│   │   ├── scoring_engine.py       # Taint decay, Random Forest ML model, top-N ranking
│   │   ├── audit_service.py        # Cryptographic SHA-256 hash-chaining & tamper detection
│   │   └── report_service.py       # ReportLab PDF dossier & standalone HTML graph generator
│   └── data/
│       ├── demo_cases.py           # Pre-packaged offline scenarios
│       └── seed_labels.py          # Ground-truth entity seeds (OFAC SDN, Binance, etc.)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx   # 7 metric cards, Recharts visualizations, recent cases
│   │   │   ├── InvestigationPage.jsx# Interactive vis-network canvas, route highlight, inspector
│   │   │   ├── ThreatRadarPage.jsx # Heuristic modules & cybersecurity threat scanner
│   │   │   ├── AuditLogPage.jsx    # Real-time SHA-256 chain verification & tamper test
│   │   │   └── ReportsPage.jsx     # Live PDF dossier preview & multi-format exports
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Navigation sidebar with data-mode toggle
│   │   │   ├── TopBar.jsx          # Live debounced address validator & search
│   │   │   ├── NetworkGraph.jsx    # Vis-network interactive graph with risk colors & filters
│   │   │   ├── Card.jsx            # Themed container & StatCard components
│   │   │   └── Badge.jsx           # Risk badges, data-mode pills, tag badges
│   │   ├── api/client.js           # API client with validation & export handlers
│   │   └── App.jsx                 # Routing & state coordinator
│   └── package.json
└── README.md
```

---

## 4. Heuristic & Cybersecurity Threat Modules

### Module 4: Heuristic Engine
* **A. Bitcoin Common-Input Ownership Clustering**: Applies Union-Find multi-input co-spending heuristic. Automatically filters out CoinJoin transactions (equal output distributions) to prevent false-positive cluster inflation. *Strictly bypassed on account-based Ethereum.*
* **B. Peel-Chain Detection Engine**: Identifies asymmetric transfers where $\ge 65\%$ of value forwards repeatedly to fresh unhosted change outputs while smaller portions peel off.
* **C. Mixer Fan-In / Fan-Out Detection**: Detects equal-denomination deposit aggregation followed by unhosted dispersal and downstream multi-branch recombination.
* **D. Cross-Chain Bridge Correlation**: Correlates temporal lock/burn events on Ethereum with mint transactions on Polygon PoS within 30-minute windows (labeled **EXPERIMENTAL**).
* **E. Public Label & OFAC Ground Truth Matching**: Exact matching against US OFAC SDN sanctions list (Tornado Cash, Lazarus Group, Sinbad, Hydra Market) and verified exchange reserves. *Unlabeled addresses strictly remain "Unlabeled".*

### Module 5: Cybersecurity Threat Detection
* **Address Poisoning Defense**: Detects vanity look-alike addresses matching $\ge 4$ characters of prefix and suffix designed to hijack clipboard transactions.
* **Micro-Dust & Decoy Detection**: Flags sub-dust transactions injected into victim histories to corrupt graph analytics.
* **Graph Poisoning & Cycle Detection**: Identifies circular cycles ($A \to B \to C \to A$) engineered to manipulate graph centrality metrics.
* **API Tamper Verification**: Recalculates SHA-256 payload checksums against response data to detect interception.
* **Tamper-Evident SHA-256 Audit Log**: Every forensic event is cryptographically hashed and linked to the preceding entry ($H_n = \text{SHA256}(H_{n-1} \parallel \text{Index} \parallel \text{Timestamp} \parallel \text{Payload})$). A one-click tamper simulation demonstrably breaks the chain.

---

## 5. Offline Demo Mode (100% Offline Capability)

CryptoTrace includes **4 pre-computed offline forensic scenarios** that require no API keys or internet connection:

1. **Peel-Chain Extraction (BTC)**:
   * Target: `bc1q9x3peelchaindemo984719284710293847192` (5 Hops)
   * Pattern: Systematic 4-stage peel chain culminating in terminal change accumulator `bc1q8f7e2k947192038471928374019283746152` absorbing 79% of funds with 52.8% residual taint.
   * Adversarial Artifact: Injected micro-dust transaction `bc1qdustdecoy9999...` penalized by the scoring engine.
2. **Mixer Fan-In / Fan-Out (ETH)**:
   * Target: `0x3c21a4f009384918239019283401923849102934` (5 Hops)
   * Pattern: Coordinated deposit fan-in through Tornado Cash router followed by multi-branch recombination to unhosted sink `0x9182390192834019238491029340192834019283`.
3. **Address Poisoning & Dusting (ETH)**:
   * Target: `0x8b32948192038471928347102938471920384712` (3 Hops)
   * Pattern: Zero-value transfer from look-alike vanity address matching `0x8b32...4712`.
4. **Cross-Chain Bridge Correlation**:
   * Target: `0x71c2938471029384710293847102938471029384` (5 Hops)
   * Pattern: Correlated Ethereum bridge burn and Polygon child mint within a 14-minute window.

---

## 6. Forensic Language Compliance Standard

To adhere to international forensic reporting and evidentiary standards:
* **Required Terminology**: Findings use probabilistic qualifiers — **"probable"**, **"likely"**, and **"confidence"**.
* **Prohibited Actions**: CryptoTrace **never** asserts criminal guilt or attempts to unmask the legal identity of natural persons. All rankings represent mathematical determinations.

---

## 7. Installation & Quick Start

### Prerequisites
* Python 3.10+ (Tested through Python 3.15)
* Node.js 18+ & npm
* SQLite 3

### Step 1: Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-org/cryptotrace.git
cd cryptotrace

# Activate Python virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic sqlalchemy networkx pandas numpy scikit-learn reportlab httpx

# Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
* The API will initialize `cryptotrace.db`, run automatic table migrations, seed ground-truth labels, and serve API documentation at `http://127.0.0.1:8000/docs`.

### Step 2: Frontend Setup
```bash
cd frontend

# Install Node packages
npm install

# Start Vite development server
npm run dev
```
* Open your browser at `http://localhost:5173`.

---

## 8. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check, table discovery, and theme verification |
| `/api/dashboard/stats` | `GET` | 7 metric cards, risk distribution, timeline & relationship data |
| `/api/ingest/validate` | `POST` | Real-time multi-format BTC/ETH address & hash detection |
| `/api/trace` | `POST` | Executes multi-hop graph traversal, heuristics & scoring |
| `/api/trace/{id}` | `GET` | Retrieves full trace graph, ranked sinks, and timeline |
| `/api/wallet/{address}` | `GET` | Retrieves forensic profile, risk scores, labels, and edges |
| `/api/labels` | `GET` | Lists OFAC sanctioned entities and exchange reserve addresses |
| `/api/audit/{id}` | `GET` | Retrieves complete SHA-256 hash-chained audit trail |
| `/api/audit/verify` | `POST` | Cryptographically validates audit chain integrity from genesis |
| `/api/demo/tamper` | `POST` | Simulates adversarial tampering to verify chain breaking |
| `/api/report/{id}` | `POST` | Generates publication-grade ReportLab PDF forensic dossier |
| `/api/report/html/{id}` | `GET` | Exports standalone interactive HTML graph visualizer |
| `/api/report/json/{id}` | `GET` | Exports forensic JSON trace with audit proof |

---

## 9. Verification & Success Criteria

CryptoTrace satisfies every master prompt requirement:
- [x] Multi-hop tracing $\ge 3$ hops on peel-chain and mixer scenarios.
- [x] Ranks probable end receivers with explainable plain-English rationales.
- [x] Detects adversarial artifacts (dusting, vanity address poisoning, graph loops).
- [x] Cryptographic SHA-256 hash-chained audit log with visible tamper detection.
- [x] Runs 100% offline with bundled demo cases without API keys.
- [x] Strict visual theme (`#FFFFFF`, `#F2CCB7`, `#D9A98E`, `#FBEFE7`, `#3B2A22`) on every page.
- [x] Multi-format report export: Official PDF Dossier, Interactive HTML Graph, and JSON Ledger.
- [x] Zero mockups, placeholder buttons, or disabled features.

---

## 10. License

Released under the [MIT License](LICENSE).
Copyright (c) 2026 CryptoTrace Forensics Lab.
