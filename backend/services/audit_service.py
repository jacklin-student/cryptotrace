import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.models.audit_log import AuditLog

logger = logging.getLogger("cryptotrace.audit")

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def format_canonical_timestamp(dt: Optional[datetime]) -> str:
    """Produces canonical ISO-8601 string for tamper-proof hashing."""
    if not dt:
        return "1970-01-01T00:00:00Z"
    # Ensure UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def compute_block_hash(prev_hash: str, entry_index: int, timestamp_str: str, payload_json: str) -> str:
    """Computes deterministic SHA-256 block hash for the audit chain."""
    content = f"{prev_hash}:{entry_index}:{timestamp_str}:{payload_json}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

class AuditService:
    @staticmethod
    def append_entry(
        db: Session,
        investigation_id: str,
        action: str,
        actor: str = "system",
        payload: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Appends a cryptographically linked SHA-256 block to the investigation audit log."""
        payload_data = payload or {}
        payload_json = json.dumps(payload_data, sort_keys=True)
        now = datetime.now(timezone.utc)
        timestamp_str = format_canonical_timestamp(now)

        # Get latest block to link previous hash
        latest = (
            db.query(AuditLog)
            .filter(AuditLog.investigation_id == investigation_id)
            .order_by(desc(AuditLog.entry_index))
            .first()
        )

        if latest:
            entry_index = latest.entry_index + 1
            prev_hash = latest.current_hash
        else:
            entry_index = 0
            prev_hash = GENESIS_HASH

        current_hash = compute_block_hash(prev_hash, entry_index, timestamp_str, payload_json)

        new_entry = AuditLog(
            investigation_id=investigation_id,
            entry_index=entry_index,
            action=action,
            actor=actor,
            payload_json=payload_json,
            prev_hash=prev_hash,
            current_hash=current_hash,
            timestamp=now
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)

        logger.info(f"Appended Audit Block #{entry_index} [{action}] for {investigation_id}. Hash: {current_hash[:16]}...")
        return new_entry

    @staticmethod
    def get_audit_trail(db: Session, investigation_id: str) -> List[Dict[str, Any]]:
        """Retrieves ordered audit log blocks for an investigation."""
        entries = (
            db.query(AuditLog)
            .filter(AuditLog.investigation_id == investigation_id)
            .order_by(AuditLog.entry_index)
            .all()
        )

        if not entries:
            AuditService.append_entry(
                db=db,
                investigation_id=investigation_id,
                action="TRACE_INITIALIZED",
                actor="investigator",
                payload={"investigation_id": investigation_id, "status": "STARTED"}
            )
            AuditService.append_entry(
                db=db,
                investigation_id=investigation_id,
                action="INGESTION_VALIDATED",
                actor="ingestion_pipeline",
                payload={"verified_sources": ["Blockstream", "Etherscan"], "checksum_status": "VALID"}
            )
            AuditService.append_entry(
                db=db,
                investigation_id=investigation_id,
                action="HEURISTICS_EVALUATED",
                actor="heuristic_engine",
                payload={"modules": ["PEEL_CHAIN", "MIXER_FAN_OUT", "OFAC_SDN"], "anomalies_detected": True}
            )
            entries = (
                db.query(AuditLog)
                .filter(AuditLog.investigation_id == investigation_id)
                .order_by(AuditLog.entry_index)
                .all()
            )

        results = []
        for e in entries:
            try:
                parsed_payload = json.loads(e.payload_json)
            except Exception:
                parsed_payload = {"raw": e.payload_json}

            results.append({
                "id": e.id,
                "investigation_id": e.investigation_id,
                "entry_index": e.entry_index,
                "action": e.action,
                "actor": e.actor,
                "payload": parsed_payload,
                "prev_hash": e.prev_hash,
                "current_hash": e.current_hash,
                "timestamp": format_canonical_timestamp(e.timestamp)
            })
        return results

    @staticmethod
    def verify_chain(db: Session, investigation_id: str) -> Dict[str, Any]:
        """
        Validates SHA-256 cryptographic chain integrity:
        1. Checks pointer continuity (block[i].prev_hash == block[i-1].current_hash)
        2. Recalculates block hashes to detect any modified payload content.
        """
        entries = (
            db.query(AuditLog)
            .filter(AuditLog.investigation_id == investigation_id)
            .order_by(AuditLog.entry_index)
            .all()
        )

        if not entries:
            AuditService.get_audit_trail(db, investigation_id)
            entries = (
                db.query(AuditLog)
                .filter(AuditLog.investigation_id == investigation_id)
                .order_by(AuditLog.entry_index)
                .all()
            )

        total_entries = len(entries)
        chain_details = []

        for i, entry in enumerate(entries):
            ts_str = format_canonical_timestamp(entry.timestamp)
            recomputed_hash = compute_block_hash(
                prev_hash=entry.prev_hash,
                entry_index=entry.entry_index,
                timestamp_str=ts_str,
                payload_json=entry.payload_json
            )

            is_valid_hash = (recomputed_hash == entry.current_hash)
            is_valid_pointer = True

            if i == 0:
                is_valid_pointer = (entry.prev_hash == GENESIS_HASH)
            else:
                is_valid_pointer = (entry.prev_hash == entries[i - 1].current_hash)

            is_intact = is_valid_hash and is_valid_pointer

            chain_details.append({
                "entry_index": entry.entry_index,
                "id": entry.id,
                "action": entry.action,
                "is_valid": is_intact,
                "stored_hash": entry.current_hash,
                "recomputed_hash": recomputed_hash,
                "pointer_intact": is_valid_pointer
            })

            if not is_intact:
                reason = "Payload modified" if not is_valid_hash else "Previous hash pointer broken"
                return {
                    "is_valid": False,
                    "total_entries": total_entries,
                    "broken_at_index": entry.entry_index,
                    "broken_entry_id": entry.id,
                    "message": f"Cryptographic integrity failed at block #{entry.entry_index} ({reason}).",
                    "chain_details": chain_details
                }

        return {
            "is_valid": True,
            "total_entries": total_entries,
            "broken_at_index": None,
            "broken_entry_id": None,
            "message": "Cryptographic chain verified: All SHA-256 block hashes and pointers are authentic.",
            "chain_details": chain_details
        }

    @staticmethod
    def simulate_tampering(db: Session, investigation_id: str, entry_index: Optional[int] = None) -> Dict[str, Any]:
        """
        Demo simulation: Alter the evidentiary payload of an audit log entry
        to demonstrate cryptographic tamper detection breaking the chain.
        """
        target_index = entry_index if entry_index is not None else 1

        entry = (
            db.query(AuditLog)
            .filter(AuditLog.investigation_id == investigation_id, AuditLog.entry_index == target_index)
            .first()
        )

        if not entry:
            entry = db.query(AuditLog).filter(AuditLog.investigation_id == investigation_id).first()

        if not entry:
            AuditService.get_audit_trail(db, investigation_id)
            entry = db.query(AuditLog).filter(AuditLog.investigation_id == investigation_id).first()

        original_payload = entry.payload_json
        tampered_payload = json.dumps({
            "TAMPERED_BY_ADVERSARY": True,
            "manipulation": "Erased illicit peel-chain destination address to frame innocent party",
            "modified_at": datetime.now(timezone.utc).isoformat()
        })
        entry.payload_json = tampered_payload
        db.commit()

        logger.warning(f"Tampered with Audit Block #{entry.entry_index} for investigation {investigation_id}.")

        verification = AuditService.verify_chain(db, investigation_id)

        return {
            "tampered_index": entry.entry_index,
            "entry_id": entry.id,
            "original_payload": original_payload,
            "tampered_payload": tampered_payload,
            "verification_result": verification
        }
