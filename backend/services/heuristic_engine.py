import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set, Tuple
from sqlalchemy.orm import Session
import networkx as nx

from backend.models.cluster import Cluster
from backend.models.label import Label
from backend.models.wallet import Wallet
from backend.models.edge import Edge
from backend.models.alert import Alert

logger = logging.getLogger("cryptotrace.heuristics")

class DisjointSet:
    """Disjoint Set Union (Union-Find) for Bitcoin common-input address clustering."""
    def __init__(self):
        self.parent = {}
        self.rank = {}

    def find(self, item: str) -> str:
        if item not in self.parent:
            self.parent[item] = item
            self.rank[item] = 0
            return item
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, item1: str, item2: str):
        root1 = self.find(item1)
        root2 = self.find(item2)
        if root1 != root2:
            if self.rank[root1] < self.rank[root2]:
                self.parent[root1] = root2
            elif self.rank[root1] > self.rank[root2]:
                self.parent[root2] = root1
            else:
                self.parent[root2] = root1
                self.rank[root1] += 1

class HeuristicEngine:
    @staticmethod
    def run_all_heuristics(
        db: Session,
        investigation_id: str,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        chain: str
    ) -> Dict[str, Any]:
        """
        Executes complete heuristic suite:
        A. BTC Common-Input Clustering (skipped on Ethereum)
        B. Peel-Chain Detection
        C. Mixer Fan-In / Fan-Out
        D. Bridge Cross-Chain Correlation
        E. Public Label & OFAC Matching
        """
        node_dict = {n["id"]: n for n in nodes}
        new_alerts = []

        # A. Address Clustering (BTC only)
        clusters = []
        if chain.upper() == "BTC":
            clusters = HeuristicEngine.apply_btc_address_clustering(db, node_dict, edges)

        # B. Peel-Chain Detection
        peel_alerts, peel_nodes = HeuristicEngine.detect_peel_chains(edges, node_dict)
        new_alerts.extend(peel_alerts)

        # C. Mixer Fan-In / Fan-Out Detection
        mixer_alerts = HeuristicEngine.detect_mixer_patterns(edges, node_dict, db)
        new_alerts.extend(mixer_alerts)

        # D. Bridge Cross-Chain Correlation
        bridge_alerts = HeuristicEngine.correlate_cross_chain_bridge(edges, node_dict, db)
        new_alerts.extend(bridge_alerts)

        # E. Label Matching (OFAC Sanctions, Exchanges, Bridges)
        HeuristicEngine.match_entity_labels(db, node_dict)

        # Persist new alerts into database
        for a in new_alerts:
            alert_model = Alert(
                investigation_id=investigation_id,
                threat_type=a["threat_type"],
                severity=a["severity"],
                title=a["title"],
                description=a["description"],
                affected_wallets=json.dumps(a.get("affected_wallets", [])),
                evidence_json=json.dumps(a.get("evidence", {})),
                created_at=datetime.now(timezone.utc)
            )
            db.add(alert_model)

        # Update node list with enriched data
        enriched_nodes = list(node_dict.values())
        return {
            "nodes": enriched_nodes,
            "edges": edges,
            "clusters": clusters,
            "alerts": new_alerts
        }

    # -----------------------------------------------------------------------
    # A. BTC Common-Input Clustering
    # -----------------------------------------------------------------------
    @staticmethod
    def apply_btc_address_clustering(
        db: Session,
        node_dict: Dict[str, Dict[str, Any]],
        edges: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        tx_inputs: Dict[str, Set[str]] = {}
        tx_outputs: Dict[str, List[float]] = {}

        for e in edges:
            tx_h = e.get("tx_hash")
            if not tx_h:
                continue
            if tx_h not in tx_inputs:
                tx_inputs[tx_h] = set()
                tx_outputs[tx_h] = []
            tx_inputs[tx_h].add(e["from"])
            tx_outputs[tx_h].append(e.get("amount", 0.0))

        dsu = DisjointSet()
        active_tx_hashes = []

        for tx_h, inputs in tx_inputs.items():
            outputs = tx_outputs.get(tx_h, [])
            if len(outputs) >= 4:
                rounded = [round(v, 4) for v in outputs]
                if len(set(rounded)) <= 2:
                    logger.info(f"Skipping CoinJoin tx {tx_h} from common-input clustering.")
                    continue

            if len(inputs) > 1:
                input_list = list(inputs)
                first = input_list[0]
                for other in input_list[1:]:
                    dsu.union(first, other)
                active_tx_hashes.append(tx_h)

        clusters_map: Dict[str, List[str]] = {}
        for addr in node_dict.keys():
            root = dsu.find(addr)
            if root not in clusters_map:
                clusters_map[root] = []
            clusters_map[root].append(addr)

        created_clusters = []
        cluster_idx = 1
        now = datetime.now(timezone.utc)

        for root, members in clusters_map.items():
            if len(members) > 1:
                cluster_id = f"BTC-CLUS-{cluster_idx:03d}"
                cluster_idx += 1
                confidence = 92.5

                existing = db.query(Cluster).filter(Cluster.cluster_id == cluster_id).first()
                if not existing:
                    cluster_rec = Cluster(
                        cluster_id=cluster_id,
                        chain="BTC",
                        heuristic_type="COMMON_INPUT",
                        confidence=confidence,
                        member_addresses=json.dumps(members),
                        notes="Common-input ownership clustered via co-spending graph analysis (CoinJoin filtered).",
                        created_at=now
                    )
                    db.add(cluster_rec)

                for addr in members:
                    if addr in node_dict:
                        node_dict[addr]["cluster_id"] = cluster_id
                        tags = node_dict[addr].setdefault("heuristic_tags", [])
                        if "COMMON_INPUT_CLUSTER" not in tags:
                            tags.append("COMMON_INPUT_CLUSTER")

                created_clusters.append({
                    "cluster_id": cluster_id,
                    "confidence": confidence,
                    "member_count": len(members),
                    "members": members
                })

        return created_clusters

    # -----------------------------------------------------------------------
    # B. Peel-Chain Detection
    # -----------------------------------------------------------------------
    @staticmethod
    def detect_peel_chains(
        edges: List[Dict[str, Any]],
        node_dict: Dict[str, Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], Set[str]]:
        alerts = []
        peeled_nodes = set()

        out_edges_by_src: Dict[str, List[Dict[str, Any]]] = {}
        for e in edges:
            src = e["from"]
            if src not in out_edges_by_src:
                out_edges_by_src[src] = []
            out_edges_by_src[src].append(e)

        peel_chain_hops = []
        for src, out_list in out_edges_by_src.items():
            if len(out_list) >= 2:
                amounts = [e.get("amount", 0.0) for e in out_list]
                total = sum(amounts)
                if total > 0:
                    sorted_edges = sorted(out_list, key=lambda x: x.get("amount", 0.0), reverse=True)
                    largest = sorted_edges[0]
                    forward_ratio = largest.get("amount", 0.0) / total
                    if forward_ratio >= 0.65:
                        largest["edge_type"] = "PEEL_FORWARD"
                        tags = largest.setdefault("heuristic_tags", [])
                        if "peel_change" not in tags:
                            tags.append("peel_change")
                        peel_chain_hops.append(largest["to"])
                        peeled_nodes.add(src)
                        peeled_nodes.add(largest["to"])

                        if largest["to"] in node_dict:
                            ntags = node_dict[largest["to"]].setdefault("heuristic_tags", [])
                            if "PEEL_CHANGE_NODE" not in ntags:
                                ntags.append("PEEL_CHANGE_NODE")

        peel_depth = len(peel_chain_hops)
        if peel_depth >= 2:
            alerts.append({
                "threat_type": "PEEL_CHAIN",
                "severity": "HIGH" if peel_depth >= 4 else "MEDIUM",
                "title": f"Peel Chain Laundering Sequence Identified ({peel_depth} Hops)",
                "description": f"Identified recurring 'large change forward, small spend out' peel chain across {peel_depth} sequential hops.",
                "affected_wallets": list(peeled_nodes),
                "evidence": {
                    "peel_depth": peel_depth,
                    "chain_hops": peel_chain_hops,
                    "pattern": "asymmetric_value_forwarding"
                }
            })

        return alerts, peeled_nodes

    # -----------------------------------------------------------------------
    # C. Mixer Fan-In / Fan-Out Detection
    # -----------------------------------------------------------------------
    @staticmethod
    def detect_mixer_patterns(
        edges: List[Dict[str, Any]],
        node_dict: Dict[str, Dict[str, Any]],
        db: Session
    ) -> List[Dict[str, Any]]:
        alerts = []
        mixer_nodes = set()

        for node_id, node in node_dict.items():
            tags = node.get("heuristic_tags") or []
            entity = node.get("entity_label") or ""
            if "MIXER_POOL" in tags or "Tornado Cash" in entity:
                mixer_nodes.add(node_id)

        for e in edges:
            if e["from"] in mixer_nodes:
                e["edge_type"] = "MIXER_FAN_OUT"
                etags = e.setdefault("heuristic_tags", [])
                if "mixer_exit" not in etags:
                    etags.append("mixer_exit")

                dst = e["to"]
                if dst in node_dict:
                    dtags = node_dict[dst].setdefault("heuristic_tags", [])
                    if "MIXER_EXIT_FORWARDER" not in dtags:
                        dtags.append("MIXER_EXIT_FORWARDER")
                    node_dict[dst]["risk_score"] = max(node_dict[dst].get("risk_score", 0.0), 80.0)
                    node_dict[dst]["risk_level"] = "HIGH"

        inbound_mixer_exits: Dict[str, int] = {}
        for e in edges:
            if e.get("edge_type") == "MIXER_FAN_OUT" or "mixer_exit" in (e.get("heuristic_tags") or []):
                dst = e["to"]
                inbound_mixer_exits[dst] = inbound_mixer_exits.get(dst, 0) + 1

        for dst, count in inbound_mixer_exits.items():
            if count >= 2 and dst in node_dict:
                node_dict[dst].setdefault("heuristic_tags", []).append("MIXER_RECOMBINATION")
                node_dict[dst]["is_probable_end_receiver"] = True
                node_dict[dst]["risk_score"] = 94.0
                node_dict[dst]["confidence_score"] = 88.0
                node_dict[dst]["risk_level"] = "HIGH"
                node_dict[dst]["reasoning"] = f"Probable end receiver: Recombined {count} separate mixer exit withdrawals."

                alerts.append({
                    "threat_type": "MIXER_FAN_IN_OUT",
                    "severity": "CRITICAL",
                    "title": "Mixer Fan-Out Recombination Identified",
                    "description": f"Wallet {dst[:8]}... recombined {count} mixer withdrawal branches.",
                    "affected_wallets": [dst],
                    "evidence": {"recombined_branches": count}
                })

        return alerts

    # -----------------------------------------------------------------------
    # D. Bridge Cross-Chain Correlation
    # -----------------------------------------------------------------------
    @staticmethod
    def correlate_cross_chain_bridge(
        edges: List[Dict[str, Any]],
        node_dict: Dict[str, Dict[str, Any]],
        db: Session
    ) -> List[Dict[str, Any]]:
        alerts = []
        bridge_addresses = {
            "0xa0c68c638235ee32657e8f720a23cec1bfc77c77": "Polygon (Matic) PoS Bridge",
            "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f": "Arbitrum One Gateway Router"
        }

        for e in edges:
            to_addr = e["to"].lower()
            if to_addr in bridge_addresses:
                e["edge_type"] = "BRIDGE"
                tags = e.setdefault("heuristic_tags", [])
                tags.append("bridge_deposit")
                tags.append("experimental_match")

                bridge_name = bridge_addresses[to_addr]
                alerts.append({
                    "threat_type": "CROSS_CHAIN_BRIDGE",
                    "severity": "MEDIUM",
                    "title": f"Cross-Chain Bridge Interaction Detected ({bridge_name})",
                    "description": f"Target deposited funds into {bridge_name}. Cross-chain matching is probabilistic and designated EXPERIMENTAL.",
                    "affected_wallets": [e["from"], e["to"]],
                    "evidence": {
                        "bridge_contract": to_addr,
                        "bridge_name": bridge_name,
                        "status": "EXPERIMENTAL"
                    }
                })

        return alerts

    # -----------------------------------------------------------------------
    # E. Entity Label & Sanctions Matching
    # -----------------------------------------------------------------------
    @staticmethod
    def match_entity_labels(db: Session, node_dict: Dict[str, Dict[str, Any]]) -> None:
        addresses = list(node_dict.keys())
        labels = db.query(Label).filter(Label.address.in_(addresses)).all()
        label_lookup = {l.address.lower(): l for l in labels}

        for addr, node in node_dict.items():
            clean_addr = addr.lower()
            if clean_addr in label_lookup:
                lbl = label_lookup[clean_addr]
                node["entity_label"] = lbl.entity_name
                node["category"] = lbl.category
                node["source_name"] = lbl.source_name
                if lbl.category == "SANCTIONED_OFAC":
                    node["risk_level"] = "HIGH"
                    node["risk_score"] = 100.0
                    node.setdefault("heuristic_tags", []).append("SANCTIONED_OFAC")
                    node.setdefault("threat_tags", []).append("OFAC_SDN_MATCH")
                    node["reasoning"] = f"Direct match with {lbl.source_name} ({lbl.entity_name})."
                elif lbl.category == "EXCHANGE":
                    node.setdefault("heuristic_tags", []).append("EXCHANGE_HOT_WALLET")
                    node["risk_score"] = min(node.get("risk_score", 50.0), 20.0)
                    node["risk_level"] = "LOW"
            else:
                if not node.get("entity_label"):
                    node["entity_label"] = "Unlabeled Wallet"
                    node["category"] = "UNLABELED"
