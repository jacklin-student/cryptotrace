import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from backend.data.demo_cases import DEMO_CASES
from backend.models.investigation import Investigation
from backend.models.wallet import Wallet
from backend.models.edge import Edge
from backend.models.transaction import Transaction
from backend.models.alert import Alert
from backend.models.audit_log import AuditLog

class DemoService:
    @staticmethod
    def get_all_demo_summaries() -> List[Dict[str, Any]]:
        """Returns metadata summaries for all bundled offline demo cases."""
        summaries = []
        for case_id, case in DEMO_CASES.items():
            summaries.append({
                "id": case["id"],
                "title": case["title"],
                "target_address": case["target_address"],
                "target_chain": case["target_chain"],
                "depth": case["depth"],
                "description": case["description"],
                "node_count": len(case["nodes"]),
                "edge_count": len(case["edges"]),
                "alert_count": len(case["alerts"]),
                "data_mode": "DEMO"
            })
        return summaries

    @staticmethod
    def find_demo_by_target(target: str) -> Optional[Dict[str, Any]]:
        """Finds demo case by target address or case_id."""
        clean = target.strip().lower()
        for case_id, case in DEMO_CASES.items():
            if case_id.lower() == clean or case["target_address"].lower() == clean:
                return case
        return None

    @staticmethod
    def load_demo_into_db(db: Session, case_id: str) -> Optional[Dict[str, Any]]:
        """Loads demo case graph data into SQLite database."""
        case = DEMO_CASES.get(case_id)
        if not case:
            case = DemoService.find_demo_by_target(case_id)
        if not case:
            return None

        inv_id = f"INV-{case['id'].upper()}"
        now = datetime.now(timezone.utc)

        # 1. Upsert Investigation
        inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
        if not inv:
            inv = Investigation(
                id=inv_id,
                title=case["title"],
                target_address=case["target_address"],
                target_type=case["target_type"],
                target_chain=case["target_chain"],
                depth=case["depth"],
                status="COMPLETED",
                is_truncated=False,
                data_mode="DEMO",
                summary_json=json.dumps({
                    "nodes": len(case["nodes"]),
                    "edges": len(case["edges"]),
                    "alerts": len(case["alerts"]),
                    "probable_receivers": len([n for n in case["nodes"] if n.get("is_probable_end_receiver")])
                }),
                created_at=now,
                updated_at=now
            )
            db.add(inv)
            db.commit()

        # 2. Insert or Update Wallets
        for n in case["nodes"]:
            existing_w = db.query(Wallet).filter(Wallet.address == n["id"]).first()
            if not existing_w:
                w = Wallet(
                    address=n["id"],
                    chain=n.get("chain", case["target_chain"]),
                    cluster_id=n.get("cluster_id"),
                    risk_score=n.get("risk_score", 0.0),
                    risk_level=n.get("risk_level", "LOW"),
                    confidence_score=n.get("confidence_score", 0.0),
                    is_probable_end_receiver=n.get("is_probable_end_receiver", False),
                    rank=n.get("rank"),
                    balance=n.get("balance", 0.0),
                    heuristic_tags=json.dumps(n.get("heuristic_tags", [])),
                    threat_tags=json.dumps(n.get("threat_tags", [])),
                    reasoning=n.get("reasoning"),
                    created_at=now,
                    updated_at=now
                )
                db.add(w)

        # 3. Clean and re-insert Edges for this investigation
        db.query(Edge).filter(Edge.investigation_id == inv_id).delete()
        seen_tx_hashes = set()

        for e in case["edges"]:
            edge_model = Edge(
                investigation_id=inv_id,
                source_address=e["from"],
                target_address=e["to"],
                tx_hash=e["tx_hash"],
                amount=e["amount"],
                hop_number=e["hop_number"],
                chain=e.get("chain", case["target_chain"]),
                heuristic_tags=json.dumps(e.get("heuristic_tags", [])),
                is_adversarial=e.get("is_adversarial", False),
                edge_type=e.get("edge_type", "TRANSFER"),
                timestamp=now
            )
            db.add(edge_model)

            # Ensure Transaction record is added only once per tx_hash
            if e["tx_hash"] not in seen_tx_hashes:
                seen_tx_hashes.add(e["tx_hash"])
                existing_tx = db.query(Transaction).filter(Transaction.tx_hash == e["tx_hash"]).first()
                if not existing_tx:
                    tx_rec = Transaction(
                        tx_hash=e["tx_hash"],
                        chain=e.get("chain", case["target_chain"]),
                        sender=e["from"],
                        receiver=e["to"],
                        amount=e["amount"],
                        timestamp=now,
                        verification_status="DEMO",
                        sha256_hash=hashlib.sha256(e["tx_hash"].encode()).hexdigest(),
                        is_peel_chain="peel" in e.get("edge_type", "").lower(),
                        is_dust=e.get("is_adversarial", False)
                    )
                    db.add(tx_rec)

        # 4. Clean and re-insert Alerts
        db.query(Alert).filter(Alert.investigation_id == inv_id).delete()
        for a in case["alerts"]:
            alert_model = Alert(
                investigation_id=inv_id,
                threat_type=a["threat_type"],
                severity=a["severity"],
                title=a["title"],
                description=a["description"],
                affected_wallets=json.dumps(a.get("affected_wallets", [])),
                evidence_json=json.dumps(a.get("evidence", {})),
                created_at=now
            )
            db.add(alert_model)

        # 5. Initialize Hash-Chained Audit Trail if not already present
        audit_count = db.query(AuditLog).filter(AuditLog.investigation_id == inv_id).count()
        if audit_count == 0:
            genesis_prev = "0000000000000000000000000000000000000000000000000000000000000000"
            payload_0 = json.dumps({"event": "TRACE_INITIALIZED", "target": case["target_address"], "mode": "DEMO"})
            hash_0 = hashlib.sha256(f"{genesis_prev}:0:{payload_0}".encode()).hexdigest()

            entry_0 = AuditLog(
                investigation_id=inv_id,
                entry_index=0,
                action="TRACE_INITIALIZED",
                actor="system",
                payload_json=payload_0,
                prev_hash=genesis_prev,
                current_hash=hash_0,
                timestamp=now
            )
            db.add(entry_0)

            payload_1 = json.dumps({
                "event": "GRAPH_ASSEMBLED",
                "nodes": len(case["nodes"]),
                "edges": len(case["edges"]),
                "probable_receivers": [n["id"] for n in case["nodes"] if n.get("is_probable_end_receiver")]
            })
            hash_1 = hashlib.sha256(f"{hash_0}:1:{payload_1}".encode()).hexdigest()
            entry_1 = AuditLog(
                investigation_id=inv_id,
                entry_index=1,
                action="GRAPH_ASSEMBLED",
                actor="forensics_engine",
                payload_json=payload_1,
                prev_hash=hash_0,
                current_hash=hash_1,
                timestamp=now
            )
            db.add(entry_1)

        db.commit()
        return case
