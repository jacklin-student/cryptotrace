import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, Set
import networkx as nx
from sqlalchemy.orm import Session

from backend.models.investigation import Investigation
from backend.models.wallet import Wallet
from backend.models.edge import Edge
from backend.models.transaction import Transaction
from backend.models.alert import Alert
from backend.services.detector import detect_identifier
from backend.services.ingestion import IngestionEngine, NormalizedTransaction
from backend.services.demo_service import DemoService
from backend.services.heuristic_engine import HeuristicEngine
from backend.services.security import CybersecurityEngine
from backend.services.scoring_engine import ScoringEngine
from backend.services.audit_service import AuditService
from backend.config import settings

logger = logging.getLogger("cryptotrace.graph")

class GraphEngine:
    def __init__(self, max_nodes: int = 100, max_edges: int = 250):
        self.max_nodes = max_nodes
        self.max_edges = max_edges
        self.graph = nx.DiGraph()
        self.is_truncated = False
        self.truncation_reason: Optional[str] = None
        self.scoring_engine = ScoringEngine()

    def build_trace(
        self,
        db: Session,
        target: str,
        depth: int = 3,
        data_mode: str = "DEMO",
        chain: Optional[str] = None,
        investigation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes multi-hop traversal, heuristics, cybersecurity detection,
        and evidence confidence scoring with ranked probable end receivers.
        """
        detection = detect_identifier(target)
        target_addr = detection["target"] if detection["valid"] else target
        target_chain = chain or (detection["chain"] if detection["valid"] else "BTC")
        inv_id = investigation_id or f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        # 1. Traversal / Extraction
        demo_case = DemoService.find_demo_by_target(target_addr)
        if data_mode.upper() == "DEMO" or demo_case:
            trace_data = self._build_from_demo_or_fallback(db, target_addr, depth, demo_case, target_chain)
        else:
            trace_data = self._traverse_live_multihop(db, target_addr, target_chain, depth)

        # 2. Apply Heuristics (Clustering, Peel Chains, Mixers, Bridges, Labels)
        heuristic_results = HeuristicEngine.run_all_heuristics(
            db=db,
            investigation_id=inv_id,
            nodes=trace_data["nodes"],
            edges=trace_data["edges"],
            chain=target_chain
        )
        trace_data["nodes"] = heuristic_results["nodes"]
        trace_data["edges"] = heuristic_results["edges"]
        trace_data["clusters"] = heuristic_results["clusters"]
        trace_data["alerts"].extend(heuristic_results["alerts"])

        # 3. Apply Cybersecurity Threat Detection
        cyber_alerts = []
        cyber_alerts.extend(CybersecurityEngine.detect_address_poisoning(trace_data["nodes"], trace_data["edges"]))
        cyber_alerts.extend(CybersecurityEngine.detect_dust_and_decoys(trace_data["edges"], trace_data["nodes"]))
        cyber_alerts.extend(CybersecurityEngine.detect_graph_poisoning(trace_data["edges"], trace_data["nodes"]))
        trace_data["alerts"].extend(cyber_alerts)

        # 4. Phase 6: Apply Evidence Confidence Scoring & ML Ranking
        scored_nodes = self.scoring_engine.evaluate_graph_nodes(
            nodes=trace_data["nodes"],
            edges=trace_data["edges"],
            root_address=target_addr,
            is_truncated=trace_data["is_truncated"],
            chain=target_chain
        )
        trace_data["nodes"] = scored_nodes

        # Extract ranked receivers
        ranked_receivers = [n for n in scored_nodes if n.get("is_probable_end_receiver")]
        ranked_receivers.sort(key=lambda x: x.get("rank") or 99)
        trace_data["probable_end_receivers"] = ranked_receivers

        # Attach ML feature importance to stats
        trace_data["stats"]["feature_importances"] = self.scoring_engine.get_feature_importances()
        trace_data["stats"]["heuristic_alerts_count"] = len(trace_data["alerts"])
        trace_data["stats"]["clusters_count"] = len(heuristic_results["clusters"])
        trace_data["stats"]["adversarial_alerts_count"] = len(cyber_alerts)
        trace_data["stats"]["probable_receivers_count"] = len(ranked_receivers)

        return trace_data

    def _build_from_demo_or_fallback(
        self,
        db: Session,
        target_addr: str,
        depth: int,
        demo_case: Optional[Dict[str, Any]],
        chain: str
    ) -> Dict[str, Any]:
        case = demo_case or DemoService.find_demo_by_target("demo-peel-chain")
        DemoService.load_demo_into_db(db, case["id"])

        self.graph.clear()
        node_map = {}
        for n in case["nodes"]:
            self.graph.add_node(
                n["id"],
                label=n["label"],
                chain=n.get("chain", chain),
                risk_score=n.get("risk_score", 0.0),
                risk_level=n.get("risk_level", "LOW"),
                confidence_score=n.get("confidence_score", 0.0),
                is_probable_end_receiver=n.get("is_probable_end_receiver", False),
                rank=n.get("rank"),
                cluster_id=n.get("cluster_id"),
                entity_label=n.get("entity_label"),
                balance=n.get("balance", 0.0),
                heuristic_tags=n.get("heuristic_tags", []),
                threat_tags=n.get("threat_tags", []),
                reasoning=n.get("reasoning")
            )
            node_map[n["id"]] = n

        edge_list = []
        for e in case["edges"]:
            if e["hop_number"] <= depth:
                self.graph.add_edge(
                    e["from"],
                    e["to"],
                    id=e["id"],
                    tx_hash=e["tx_hash"],
                    amount=e["amount"],
                    hop_number=e["hop_number"],
                    chain=e.get("chain", chain),
                    heuristic_tags=e.get("heuristic_tags", []),
                    is_adversarial=e.get("is_adversarial", False),
                    edge_type=e.get("edge_type", "TRANSFER")
                )
                edge_list.append(e)

        timeline = self._build_timeline_from_edges(edge_list)
        probable_receivers = [n for n in case["nodes"] if n.get("is_probable_end_receiver")]

        return {
            "target": target_addr,
            "chain": chain,
            "depth": depth,
            "is_truncated": False,
            "truncation_reason": None,
            "nodes": [self._format_node(n_id) for n_id in self.graph.nodes],
            "edges": edge_list,
            "probable_end_receivers": probable_receivers,
            "alerts": list(case["alerts"]),
            "timeline": timeline,
            "stats": {
                "total_nodes": self.graph.number_of_nodes(),
                "total_edges": self.graph.number_of_edges(),
                "depth_reached": min(depth, case["depth"]),
                "probable_receivers_count": len(probable_receivers),
                "data_mode": "DEMO"
            }
        }

    def _traverse_live_multihop(
        self,
        db: Session,
        root_address: str,
        chain: str,
        max_depth: int
    ) -> Dict[str, Any]:
        self.graph.clear()
        self.is_truncated = False
        self.truncation_reason = None

        queue: List[Tuple[str, int]] = [(root_address, 0)]
        visited_nodes: Set[str] = {root_address}
        visited_txs: Set[str] = set()

        self.graph.add_node(
            root_address,
            label="Root Investigation Target",
            chain=chain,
            risk_score=75.0,
            risk_level="HIGH",
            confidence_score=90.0,
            is_probable_end_receiver=False,
            heuristic_tags=["SOURCE_TARGET"],
            threat_tags=[],
            reasoning="Source wallet initiating multi-hop forensic trace."
        )

        all_edges = []
        alerts = []

        while queue:
            current_addr, current_hop = queue.pop(0)

            if current_hop >= max_depth:
                continue

            if chain == "BTC":
                txs = IngestionEngine.fetch_bitcoin_address_txs(db, current_addr, max_txs=15)
            else:
                txs = IngestionEngine.fetch_ethereum_address_txs(db, current_addr, max_txs=15)

            for tx in txs:
                if tx.tx_hash in visited_txs:
                    continue
                visited_txs.add(tx.tx_hash)

                if self.graph.number_of_edges() >= self.max_edges:
                    self.is_truncated = True
                    self.truncation_reason = f"Max edge limit ({self.max_edges}) reached at hop {current_hop + 1}."
                    break

                if chain == "BTC" and tx.outputs:
                    for vout in tx.outputs:
                        dst_addr = vout.get("address")
                        out_amount = vout.get("amount_btc", 0.0)
                        if not dst_addr or dst_addr == current_addr:
                            continue

                        if self.graph.number_of_nodes() >= self.max_nodes:
                            self.is_truncated = True
                            self.truncation_reason = f"Max node limit ({self.max_nodes}) reached at hop {current_hop + 1}."
                            break

                        if dst_addr not in visited_nodes:
                            visited_nodes.add(dst_addr)
                            self._add_discovered_node(dst_addr, chain, current_hop + 1)
                            queue.append((dst_addr, current_hop + 1))

                        edge_data = {
                            "id": f"e_{tx.tx_hash[:8]}_{len(all_edges)}",
                            "from": current_addr,
                            "to": dst_addr,
                            "tx_hash": tx.tx_hash,
                            "amount": out_amount,
                            "hop_number": current_hop + 1,
                            "chain": chain,
                            "heuristic_tags": ["utxo_output"],
                            "is_adversarial": False,
                            "edge_type": "TRANSFER",
                            "timestamp": tx.timestamp.isoformat()
                        }
                        self.graph.add_edge(current_addr, dst_addr, **edge_data)
                        all_edges.append(edge_data)

                else:
                    dst_addr = tx.receiver
                    if not dst_addr or dst_addr == current_addr:
                        continue

                    if self.graph.number_of_nodes() >= self.max_nodes:
                        self.is_truncated = True
                        self.truncation_reason = f"Max node limit ({self.max_nodes}) reached at hop {current_hop + 1}."
                        break

                    if dst_addr not in visited_nodes:
                        visited_nodes.add(dst_addr)
                        self._add_discovered_node(dst_addr, chain, current_hop + 1)
                        queue.append((dst_addr, current_hop + 1))

                    edge_data = {
                        "id": f"e_{tx.tx_hash[:8]}_{len(all_edges)}",
                        "from": current_addr,
                        "to": dst_addr,
                        "tx_hash": tx.tx_hash,
                        "amount": tx.amount,
                        "hop_number": current_hop + 1,
                        "chain": chain,
                        "heuristic_tags": ["account_transfer"],
                        "is_adversarial": tx.is_dust,
                        "edge_type": "POISON_DUST" if tx.is_dust else "TRANSFER",
                        "timestamp": tx.timestamp.isoformat()
                    }
                    self.graph.add_edge(current_addr, dst_addr, **edge_data)
                    all_edges.append(edge_data)

            if self.is_truncated:
                break

        timeline = self._build_timeline_from_edges(all_edges)

        return {
            "target": root_address,
            "chain": chain,
            "depth": max_depth,
            "is_truncated": self.is_truncated,
            "truncation_reason": self.truncation_reason,
            "nodes": [self._format_node(n_id) for n_id in self.graph.nodes],
            "edges": all_edges,
            "probable_end_receivers": [],
            "alerts": alerts,
            "timeline": timeline,
            "stats": {
                "total_nodes": self.graph.number_of_nodes(),
                "total_edges": self.graph.number_of_edges(),
                "depth_reached": max([d.get("hop_number", 1) for d in all_edges], default=1),
                "probable_receivers_count": 0,
                "data_mode": "ON-CHAIN"
            }
        }

    def _add_discovered_node(self, address: str, chain: str, hop: int):
        self.graph.add_node(
            address,
            label=f"{address[:6]}...{address[-4:]}",
            chain=chain,
            risk_score=50.0,
            risk_level="MEDIUM",
            confidence_score=70.0,
            is_probable_end_receiver=False,
            heuristic_tags=[f"hop_{hop}"],
            threat_tags=[],
            balance=0.0,
            reasoning=f"Discovered at hop {hop}."
        )

    def _build_timeline_from_edges(self, edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        timeline = []
        for e in edges:
            timeline.append({
                "hop": e.get("hop_number", 1),
                "from": e.get("from"),
                "to": e.get("to"),
                "amount": e.get("amount", 0.0),
                "chain": e.get("chain", "BTC"),
                "tx_hash": e.get("tx_hash"),
                "tag": e.get("edge_type", "TRANSFER"),
                "timestamp": e.get("timestamp", datetime.now(timezone.utc).isoformat())
            })
        timeline.sort(key=lambda x: str(x.get("timestamp", "")))
        return timeline

    def _format_node(self, node_id: str) -> Dict[str, Any]:
        data = self.graph.nodes[node_id]
        return {
            "id": node_id,
            "label": data.get("label", node_id),
            "chain": data.get("chain", "BTC"),
            "risk_score": data.get("risk_score", 0.0),
            "risk_level": data.get("risk_level", "LOW"),
            "confidence_score": data.get("confidence_score", 0.0),
            "is_probable_end_receiver": data.get("is_probable_end_receiver", False),
            "rank": data.get("rank"),
            "cluster_id": data.get("cluster_id"),
            "entity_label": data.get("entity_label"),
            "balance": data.get("balance", 0.0),
            "heuristic_tags": data.get("heuristic_tags", []),
            "threat_tags": data.get("threat_tags", []),
            "reasoning": data.get("reasoning")
        }
