from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(String, ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False)
    threat_type = Column(String, nullable=False)  # ADDRESS_POISONING, DUST_DECOY, GRAPH_POISONING, API_TAMPER, PEEL_CHAIN, MIXER_FAN_IN_OUT, CROSS_CHAIN_BRIDGE
    severity = Column(String, default="MEDIUM")   # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    affected_wallets = Column(Text, default="[]") # JSON list
    affected_txs = Column(Text, default="[]")     # JSON list
    evidence_json = Column(Text, default="{}")    # JSON object
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    investigation = relationship("Investigation", back_populates="alerts")
