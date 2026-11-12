from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from backend.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    tx_hash = Column(String, primary_key=True, index=True)
    chain = Column(String, default="BTC", index=True)
    sender = Column(String, index=True, nullable=True)    # primary input
    receiver = Column(String, index=True, nullable=True)  # primary output
    amount = Column(Float, default=0.0)
    fee = Column(Float, default=0.0)
    timestamp = Column(DateTime, nullable=True)
    block_number = Column(Integer, nullable=True)
    is_coinjoin = Column(Boolean, default=False)
    is_peel_chain = Column(Boolean, default=False)
    is_dust = Column(Boolean, default=False)
    is_poisoning = Column(Boolean, default=False)
    is_bridge = Column(Boolean, default=False)
    verification_status = Column(String, default="DEMO")  # VERIFIED, TAMPER_DETECTED, UNVERIFIED, DEMO
    sha256_hash = Column(String, nullable=True)
    raw_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
