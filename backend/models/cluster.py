from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text
from backend.database import Base

class Cluster(Base):
    __tablename__ = "clusters"

    cluster_id = Column(String, primary_key=True, index=True)
    chain = Column(String, default="BTC")
    heuristic_type = Column(String, default="COMMON_INPUT")  # COMMON_INPUT, ADDRESS_REUSE, KNOWN_ENTITY
    confidence = Column(Float, default=0.0)                  # 0 - 100
    member_addresses = Column(Text, default="[]")            # JSON array of addresses
    entity_label = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
