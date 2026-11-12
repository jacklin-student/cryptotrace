from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from backend.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    address = Column(String, primary_key=True, index=True)
    chain = Column(String, default="BTC", index=True)
    cluster_id = Column(String, nullable=True, index=True)
    risk_score = Column(Float, default=0.0)             # 0 - 100
    risk_level = Column(String, default="LOW")          # LOW, MEDIUM, HIGH
    confidence_score = Column(Float, default=0.0)       # 0 - 100
    is_probable_end_receiver = Column(Boolean, default=False, index=True)
    rank = Column(Integer, nullable=True)
    total_received = Column(Float, default=0.0)
    total_sent = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    tx_count = Column(Integer, default=0)
    heuristic_tags = Column(Text, default="[]")         # JSON list
    threat_tags = Column(Text, default="[]")            # JSON list
    reasoning = Column(Text, nullable=True)             # Human-readable forensic explanation
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
