from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(String, index=True, nullable=False)
    entry_index = Column(Integer, nullable=False)
    action = Column(String, nullable=False)       # TRACE_STARTED, NODE_ADDED, HEURISTIC_DETECTED, SECURITY_ALERT, TRACE_COMPLETED, REPORT_GENERATED
    actor = Column(String, default="system")
    payload_json = Column(Text, nullable=False)
    prev_hash = Column(String, nullable=False)
    current_hash = Column(String, nullable=False) # SHA-256(prev_hash + entry_index + timestamp + payload_json)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
