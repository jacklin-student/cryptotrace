from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Edge(Base):
    __tablename__ = "edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False)
    source_address = Column(String, index=True, nullable=False)
    target_address = Column(String, index=True, nullable=False)
    tx_hash = Column(String, index=True, nullable=False)
    amount = Column(Float, default=0.0)
    hop_number = Column(Integer, default=1)
    timestamp = Column(DateTime, nullable=True)
    chain = Column(String, default="BTC")
    heuristic_tags = Column(Text, default="[]")       # JSON list: ["peel_chain", "change_address", ...]
    is_adversarial = Column(Boolean, default=False)
    edge_type = Column(String, default="TRANSFER")     # TRANSFER, PEEL_FORWARD, CHANGE, MIXER_FAN_OUT, POISON_DUST, BRIDGE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    investigation = relationship("Investigation", back_populates="edges")
